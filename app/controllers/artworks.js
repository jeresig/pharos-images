var qs = require("querystring");
var _ = require("lodash");

module.exports = function(core, app) {

var Artwork = core.db.model("Artwork");

Artwork.prototype.getURL = function(locale) {
    return app.genURL(locale, "/artwork/" + this.artworkName);
};

app.imageSearch = function(req, res, filter, tmplParams) {
    var start = parseFloat(req.query.start || 0);
    var rows = 100;
    var q = req.param("q") || "";

    var query = {
        query: {
            filtered: {
                filter: {}
            }
        },
        size: rows,
        from: start,
        "sort": [
        /*
            {
                "dateCreated.start": {
                    "order": "asc"
                }
            },
            {
                "dateCreated.end": {
                    "order": "asc"
                }
            }
        */
        ]
    };

    query.query.filtered.query = filter;

    if (req.param("startDate") && req.param("endDate")) {
        query.filtered.filter.and = [
            {
                range: {
                    "dateCreated.start": {
                        gte: parseFloat(req.param("startDate")),
                        lte: parseFloat(req.param("endDate"))
                    }
                }
            },
            {
                range: {
                    "dateCreated.end": {
                        gte: parseFloat(req.param("startDate")),
                        lte: parseFloat(req.param("endDate"))
                    }
                }
            }
        ];
    }

    Artwork.search(query, {
        hydrate: true,
        hydrateOptions: {
            populate: "artists.artist source"
        }
    }, function(err, results){
        if (err) {
            console.error(err);
            return res.render("500");
        }

        var matches = results.hits.length;
		var end = start + matches;
		var urlPrefix = req.path + (req.query.q ?
			"?" + qs.stringify({ q: req.query.q }) : "");
		var sep = req.query.q ? "&" : "?";

		var prevLink = null;
		var nextLink = null;

		if (start > 0) {
			prevLink = app.genURL(req.i18n.getLocale(), urlPrefix +
				(start - rows > 0 ?
					sep + "start=" + (start - rows) : ""));
		}

		if (end < results.total) {
			nextLink = app.genURL(req.i18n.getLocale(), urlPrefix +
				sep + "start=" + (start + rows));
		}

        res.render("images/index", _.extend({
            q: req.param("q"),
            startDate: req.param("startDate") || process.env.DEFAULT_START_DATE,
            endDate: req.param("endDate") || process.env.DEFAULT_END_DATE,
            images: results.hits,
            total: results.total,
			start: start || 1,
			end: end,
			rows: rows,
			prev: prevLink,
			next: nextLink
        }, tmplParams));
    });
};

return {
    load: function(req, res, next, artworkName) {
        Artwork.findById(req.params.sourceId + "/" + artworkName)
            .populate("similar.artwork")
            .populate("artists.artist")
            .populate("source") // TODO: Don't do this.
            .exec(function(err, image) {
                if (err) {
                    return next(err);
                }
                if (!image) {
                    console.log("not found")
                    return next(new Error("not found"));
                }
                req.image = image;
                next();
            });
    },

    search: function(req, res) {
        var query = req.query.q || "*";

        app.imageSearch(req, res, {
            query_string: {
                query: query
            }
        }, {
            title: req.i18n.__("Results for '%s'", query),
            desc: req.i18n.__("Japanese Woodblock prints matching '%s'.", query)
        });
    },

    index: function(req, res) {
        var page = (req.param("page") > 0 ? req.param("page") : 1) - 1;
        var perPage = 100;
        var options = {
            query: "fish",
            size: perPage,
            from: page * perPage
        };

        // , hydrateOptions: {populate: "bios"}
        Artwork.search(options, {hydrate: true}, function(err, results){
            if (err) {
                return res.render("500");
            }

            res.render("images/index", {
                title: "Artworks",
                images: results.hits,
                page: page + 1,
                pages: Math.ceil(results.total / perPage)
            });
        });
    },

    show: function(req, res) {
        res.render("images/show", {
            title: req.image.getTitle(req.i18n.getLocale()),
            image: req.image,
            results: req.image.similar
        });
    }
};
};
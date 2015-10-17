var qs = require("querystring");
var _ = require("lodash");

module.exports = function(core, app) {

var Artwork = core.db.model("Artwork");

Artwork.prototype.getURL = function(locale) {
    return app.genURL(locale, "/artworks/" + this._id);
};

app.imageSearch = function(req, res, filter, tmplParams) {
    var start = parseFloat(req.query.start || 0);
    var rows = 100;
    var q = req.param("q") || "";

    var query = {
        filtered: {
            query: {
                bool: {
                    must: [
                        {
                            simple_query_string: {
                                query: filter,
                                default_operator: "and"
                            }
                        },
                        {
                            simple_query_string: {
                                fields: ["artists.*"],
                                query: req.param("qartist") || "",
                                default_operator: "and"
                            }
                        }
                    ]
                }
            },
            filter: {}
        }
    };

    if (req.param("date")) {
        var dates = req.param("date").split(";");

        query.filtered.filter.and = [
            {
                range: {
                    "dateCreateds.start": {
                        lte: parseFloat(dates[1])
                    }
                }
            },
            {
                range: {
                    "dateCreateds.end": {
                        gte: parseFloat(dates[0])
                    }
                }
            }
        ];
    }

    Artwork.search(query, {
        size: rows,
        from: start,
        hydrate: true,
        sort: [
            {
                "dateCreateds.start": {
                    "order": "asc"
                }
            },
            {
                "dateCreateds.end": {
                    "order": "asc"
                }
            }
        ],
        hydrateOptions: {
            populate: "source"
        }
    }, function(err, results){
        if (err) {
            console.error(err);
            return res.render("500");
        }

        var matches = results.hits.hits.length;
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

		if (end < results.hits.total) {
			nextLink = app.genURL(req.i18n.getLocale(), urlPrefix +
				sep + "start=" + (start + rows));
		}

        res.render("artworks/index", _.extend({
            q: req.param("q"),
            qartist: req.param("qartist"),
            minDate: process.env.DEFAULT_START_DATE,
            maxDate: process.env.DEFAULT_END_DATE,
            date: req.param("date") ||
                (process.env.DEFAULT_START_DATE + ";" +
                process.env.DEFAULT_END_DATE),
            images: results.hits.hits,
            total: results.hits.total,
			start: (results.hits.total > 0 ? start || 1 : 0),
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
        var title = req.i18n.__("Results for '%s'", query);

        if (req.query.qartist) {
            title = req.i18n.__("Artist '%s'", req.query.qartist);
        }

        app.imageSearch(req, res, query, {
            title: title,
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

            res.render("artworks/index", {
                title: "Artworks",
                images: results.hits,
                page: page + 1,
                pages: Math.ceil(results.total / perPage)
            });
        });
    },

    show: function(req, res) {
        res.render("artworks/show", {
            title: req.image.getTitle(req.i18n.getLocale()),
            artwork: req.image,
            results: req.image.similar
        });
    }
};
};
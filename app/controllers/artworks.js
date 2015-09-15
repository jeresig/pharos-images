
/**
 * Module dependencies.
 */
module.exports = function(ukiyoe, app) {

var Artwork = ukiyoe.db.model("Artwork"),
    qs = require("querystring"),
    utils = require("../lib/utils"),
    _ = require("lodash"),
    exports = {};

Artwork.prototype.getURL = function(locale) {
    return app.genURL(locale, "/artwork/" + this._id);
};

exports.load = function(req, res, next, artworkName) {
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

    Image.search(query, {
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

exports.search = function(req, res) {
    var query = req.query.q || "*";

    app.imageSearch(req, res, {
        query_string: {
            query: query
        }
    }, {
        title: req.i18n.__("Results for '%s'", query),
        desc: req.i18n.__("Japanese Woodblock prints matching '%s'.", query)
    });
};

/**
 * List
 */

exports.index = function(req, res) {
    var page = (req.param("page") > 0 ? req.param("page") : 1) - 1;
    var perPage = 100;
    var options = {
        query: "fish",
        size: perPage,
        from: page * perPage
    };

    // , hydrateOptions: {populate: "bios"}
    Image.search(options, {hydrate: true}, function(err, results){
        if (err) {
            return res.render("500");
        }

        res.render("images/index", {
            title: "Images",
            images: results.hits,
            page: page + 1,
            pages: Math.ceil(results.total / perPage)
        });
    });
};

/**
 * New image
 */

exports.new = function(req, res) {
    res.render("images/new", {
        title: "New Image",
        image: new Image({})
    });
};

/**
 * Create an image
 */

exports.create = function(req, res) {
    var image = new Image(req.body);
    image.user = req.user;

    image.save(function(err) {
        if (!err) {
            req.flash("success", "Successfully created image!");
            return res.redirect("/images/" + image._id);
        }

        res.render("images/new", {
            title: "New Image",
            image: image,
            errors: utils.errors(err.errors || err)
        });
    });
};

/**
 * Edit an image
 */

exports.edit = function(req, res) {
    res.render("images/edit", {
        title: "Edit " + req.image.title,
        image: req.image
    });
};

/**
 * Update image
 */

exports.update = function(req, res) {
    var image = req.image;
    image = _.extend(image, req.body);

    image.save(function(err) {
        if (!err) {
            return res.redirect("/images/" + image._id);
        }

        res.render("images/edit", {
            title: "Edit Image",
            image: image,
            errors: err.errors
        });
    });
};

/**
 * Show
 */

exports.show = function(req, res) {
    res.render("images/show", {
        title: req.image.getTitle(req.i18n.getLocale()),
        image: req.image,
        results: req.image.similar
    });
};

/**
 * Delete an image
 */

exports.destroy = function(req, res) {
    var image = req.image;
    image.remove(function(err) {
        req.flash("info", "Deleted successfully")
        res.redirect("/images")
    });
};

return exports;
};
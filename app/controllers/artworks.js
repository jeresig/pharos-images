var qs = require("querystring");
var _ = require("lodash");

module.exports = function(core, app) {

var Artwork = core.db.model("Artwork");
var Source = core.db.model("Source");

Artwork.prototype.getURL = function(locale) {
    return app.genURL(locale, "/artworks/" + this._id);
};

app.imageSearch = function(req, res, tmplParams) {
    var rows = 100;

    var query = {
        start: parseFloat(req.query.start || 0),
        filter: req.param("q") || "*",
        source: req.param("qsource") || req.param("sourceId") || "",
        artist: req.param("qartist") || "",
        date: req.param("date")
    };

    //var start = parseFloat(req.query.start || 0);
    //var filter = req.param("q") || "*";
    //var q = req.param("q") || "";
    //var source = req.param("qsource") || req.param("sourceId") || "";

    if (Array.isArray(query.source)) {
        query.source = query.source.join(" ");
    }

    var query = {
        filtered: {
            query: {
                bool: {
                    must: [
                        {
                            simple_query_string: {
                                query: query.filter,
                                default_operator: "and"
                            }
                        },
                        {
                            simple_query_string: {
                                fields: ["source"],
                                query: query.source,
                                default_operator: "or"
                            }
                        },
                        {
                            simple_query_string: {
                                fields: ["artists.*"],
                                query: query.artist,
                                default_operator: "and"
                            }
                        }
                    ]
                }
            },
            filter: {}
        }
    };

    if (query.date) {
        var dates = query.date.split(";");

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
        aggs: {
            sources: {
                terms: {
                    field: "source"
                }
            },
            // TODO(jeresig): Change the mapping to provide a name
            // field that has an un-analyzed version of the name
            artists: {
                terms: {
                    field: "artists.name"
                }
            }
        },
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
        var urlPrefix = req.path + qs.stringify(query);
        var sep = query.filter ? "&" : "?";

        var queryURL = function(options) {
            var params = Object.assign({}, options, query);

            for (var param in params) {
                if (params[param] === "") {
                    delete params[param];
                }
            }

            return app.genURL(req.i18n.getLocale(),
                req.path + qs.stringify(params);
        };

        var prevLink = null;
        var nextLink = null;

        if (start > 0) {
            prevLink = queryURL({
                start: (start - rows > 0 ? (start - rows) : "")
            });
        }

        if (end < results.hits.total) {
            nextLink = queryURL({
                start: (start + rows)
            });
        }

        // TODO: Cache the sources
        Source.find({}, function(err, sources) {
            res.render("artworks/index", _.extend({
                q: query.filter,
                qartist: query.artist,
                qsource: query.source.split(" "),
                sources: sources,
                queryURL: queryURL,
                minDate: process.env.DEFAULT_START_DATE,
                maxDate: process.env.DEFAULT_END_DATE,
                date: query.date ||
                    (process.env.DEFAULT_START_DATE + ";" +
                    process.env.DEFAULT_END_DATE),
                clusters: results.aggregations,
                images: results.hits.hits,
                total: results.hits.total,
                start: (results.hits.total > 0 ? start || 1 : 0),
                end: end,
                rows: rows,
                prev: prevLink,
                next: nextLink
            }, tmplParams));
        });
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

        app.imageSearch(req, res, {
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
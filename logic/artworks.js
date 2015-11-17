var qs = require("querystring");

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
        filter: req.query.filter,
        source: req.query.source || req.params.sourceId || "",
        artist: req.query.artist || "",
        date: req.query.date
    };

    var queryURL = function(options) {
        var params = Object.assign({}, query, options);

        for (var param in params) {
            if (!params[param]) {
                delete params[param];
            }
        }

        return app.genURL(req.i18n.getLocale(),
            req.path + "?" + qs.stringify(params));
    };

    var esQuery = {
        bool: {
            must: [
                {
                    query_string: {
                        query: query.filter || "*",
                        default_operator: "and"
                    }
                },
                {
                    match: {
                        source: {
                            query: Array.isArray(query.source) ?
                                query.source.join(" ") : query.source,
                            operator: "or",
                            zero_terms_query: "all"
                        }
                    }
                },
                {
                    multi_match: {
                        fields: ["artists.*"],
                        query: query.artist,
                        operator: "and",
                        zero_terms_query: "all"
                    }
                }
            ],
            filter: {}
        }
    };

    if (query.date) {
        var dates = query.date.split(";");

        esQuery.bool.filter.and = [
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

    Artwork.search(esQuery, {
        size: rows,
        from: query.start,
        aggs: {
            sources: {
                terms: {
                    field: "source"
                }
            },
            artists: {
                terms: {
                    field: "artists.name.raw"
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
        hydrate: true,
        hydrateOptions: {
            populate: "source"
        }
    }, function(err, results){
        if (err) {
            console.error(err);
            return res.render("500");
        }

        var end = query.start + results.hits.hits.length;
        var prevLink = null;
        var nextLink = null;

        if (query.start > 0) {
            prevLink = queryURL({
                start: (query.start - rows > 0 ? (query.start - rows) : "")
            });
        }

        if (end < results.hits.total) {
            nextLink = queryURL({
                start: (query.start + rows)
            });
        }

        // TODO: Cache the sources
        Source.find({}, function(err, sources) {
            res.render("artworks/index", Object.assign({
                sources: sources,
                query: query,
                queryURL: queryURL,
                minDate: process.env.DEFAULT_START_DATE,
                maxDate: process.env.DEFAULT_END_DATE,
                clusters: results.aggregations,
                images: results.hits.hits,
                total: results.hits.total,
                start: (results.hits.total > 0 ? query.start || 1 : 0),
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
        var query = req.query.q;
        var title = req.i18n.__("Results for '%s'", query || "*");

        if (req.query.qartist) {
            title = req.i18n.__("Artist '%s'", req.query.qartist);
        }

        app.imageSearch(req, res, {
            title: title,
            desc: req.i18n.__("Artworks matching '%s'.", query)
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
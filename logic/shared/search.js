"use strict";

const qs = require("querystring");

module.exports = (core, app) => {
    const Artwork = core.models.Artwork;
    const Source = core.models.Source;

    return (req, res, tmplParams) => {
        const rows = 100;

        const query = {
            start: parseFloat(req.query.start || 0),
            filter: req.query.filter,
            source: req.query.source || req.params.sourceId || "",
            artist: req.query.artist || "",
            date: req.query.date,
        };

        const queryURL = function(options) {
            const params = Object.assign({}, query, options);

            for (const param in params) {
                if (!params[param]) {
                    delete params[param];
                }
            }

            return core.urls.gen(res.locals.lang,
                `${req.path}?${qs.stringify(params)}`);
        };

        const esQuery = {
            bool: {
                must: [
                    {
                        query_string: {
                            query: query.filter || "*",
                            default_operator: "and",
                        },
                    },
                    {
                        match: {
                            source: {
                                query: Array.isArray(query.source) ?
                                    query.source.join(" ") : query.source,
                                operator: "or",
                                zero_terms_query: "all",
                            },
                        },
                    },
                    {
                        multi_match: {
                            fields: ["artists.*"],
                            query: query.artist,
                            operator: "and",
                            zero_terms_query: "all",
                        },
                    },
                ],
                filter: {},
            },
        };

        if (query.date) {
            const dates = query.date.split(";");

            esQuery.bool.filter.and = [
                {
                    range: {
                        "dateCreateds.start": {
                            lte: parseFloat(dates[1]),
                        },
                    },
                },
                {
                    range: {
                        "dateCreateds.end": {
                            gte: parseFloat(dates[0]),
                        },
                    },
                },
            ];
        }

        Artwork.search(esQuery, {
            size: rows,
            from: query.start,
            aggs: {
                sources: {
                    terms: {
                        field: "source",
                    },
                },
                artists: {
                    terms: {
                        field: "artists.name.raw",
                    },
                },
            },
            sort: [
                {
                    "dateCreateds.start": {
                        "order": "asc",
                    },
                },
                {
                    "dateCreateds.end": {
                        "order": "asc",
                    },
                },
            ],
            hydrate: true,
        }, (err, results) => {
            if (err) {
                console.error(err);
                return res.render("500");
            }

            const end = query.start + results.hits.hits.length;
            const prevLink = (query.start > 0 && queryURL({
                start: (query.start - rows > 0 ? (query.start - rows) : ""),
            }));
            const nextLink = (end < results.hits.total && queryURL({
                start: (query.start + rows),
            }));

            res.render("artworks/index", Object.assign({
                sources: Source.getSources(),
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
                next: nextLink,
            }, tmplParams));
        });
    };
};

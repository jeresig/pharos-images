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
            dateStart: req.query.dateStart,
            dateEnd: req.query.dateEnd,
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

        const matches = [
            {
                query_string: {
                    query: query.filter || "*",
                    default_operator: "and",
                },
            },
        ];

        if (query.source) {
            matches.push({
                match: {
                    source: {
                        query: Array.isArray(query.source) ?
                            query.source.join(" ") : query.source,
                        operator: "or",
                        zero_terms_query: "all",
                    },
                },
            });
        }

        if (query.artist) {
            matches.push({
                multi_match: {
                    fields: ["artists.*"],
                    query: query.artist,
                    operator: "and",
                    zero_terms_query: "all",
                },
            });
        }

        if (query.dateStart || query.dateEnd) {
            const start = query.dateStart || -10000;
            const end = query.dateEnd || (new Date).getYear() + 1900;

            const startInside = {
                bool: {
                    must: [
                        {
                            range: {
                                "dateCreateds.start": {
                                    lte: parseFloat(start),
                                },
                            },
                        },

                        {
                            range: {
                                "dateCreateds.end": {
                                    gte: parseFloat(start),
                                },
                            },
                        },
                    ],
                },
            };

            const endInside = {
                bool: {
                    must: [
                        {
                            range: {
                                "dateCreateds.start": {
                                    lte: parseFloat(end),
                                },
                            },
                        },

                        {
                            range: {
                                "dateCreateds.end": {
                                    gte: parseFloat(end),
                                },
                            },
                        },
                    ],
                },
            };

            const contains = {
                bool: {
                    must: [
                        {
                            range: {
                                "dateCreateds.start": {
                                    gte: parseFloat(start),
                                },
                            },
                        },

                        {
                            range: {
                                "dateCreateds.end": {
                                    lte: parseFloat(end),
                                },
                            },
                        },
                    ],
                },
            };

            matches.push({
                bool: {
                    should: [
                        startInside,
                        endInside,
                        contains,
                    ],
                },
            });
        }

        const esQuery = {
            bool: {
                must: matches,
                filter: {},
            },
        };

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

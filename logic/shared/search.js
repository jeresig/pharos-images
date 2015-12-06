"use strict";

const qs = require("querystring");

module.exports = (core, app) => {
    const Artwork = core.models.Artwork;
    const Source = core.models.Source;

    return (req, res, tmplParams) => {
        const rows = 100;

        const facets = {
            artist: {
                agg: {
                    terms: {
                        field: "artists.name.raw",
                        size: 50,
                    },
                },
                name: (res) => res.locals.gettext("Artists"),
                url: (bucket) => queryURL("artist", bucket.key),
                text: (bucket) => bucket.key,
            },

            source: {
                agg: {
                    terms: {
                        field: "source",
                    },
                },
                name: (res) => res.locals.gettext("Sources"),
                url: (bucket) => queryURL("source", bucket.key),
                text: (bucket) => Source.getSource(bucket.key).name,
            },

            width: {
                agg: {
                    range: {
                        field: "dimensions.width",
                        ranges: [
                            { to: 99 },
                            { from: 100, to: 199 },
                            { from: 200, to: 299 },
                            { from: 300, to: 399 },
                            { from: 400, to: 499 },
                            { from: 500, to: 599 },
                            { from: 600, to: 699 },
                            { from: 700, to: 799 },
                            { from: 800, to: 899 },
                            { from: 900, to: 999 },
                            { from: 1000, to: 1249 },
                            { from: 1250, to: 1599 },
                            { from: 1500, to: 1749 },
                            { from: 1750, to: 1999 },
                            { from: 2000 },
                        ],
                    },
                },
                name: (res) => res.locals.gettext("Width (mm)"),
                url: (bucket) => queryURL({
                    widthMin: bucket.from,
                    widthMax: bucket.to,
                }),
                text: (bucket) => bucket.to ?
                    `${bucket.from || 0}-${bucket.to}` :
                    `${bucket.from}+`,
            },

            height: {
                agg: {
                    range: {
                        field: "dimensions.height",
                        ranges: [
                            { to: 99 },
                            { from: 100, to: 199 },
                            { from: 200, to: 299 },
                            { from: 300, to: 399 },
                            { from: 400, to: 499 },
                            { from: 500, to: 599 },
                            { from: 600, to: 699 },
                            { from: 700, to: 799 },
                            { from: 800, to: 899 },
                            { from: 900, to: 999 },
                            { from: 1000, to: 1249 },
                            { from: 1250, to: 1599 },
                            { from: 1500, to: 1749 },
                            { from: 1750, to: 1999 },
                            { from: 2000 },
                        ],
                    },
                },
                name: (res) => res.locals.gettext("Height (mm)"),
                url: (bucket) => queryURL({
                    heightMin: bucket.from,
                    heightMax: bucket.to,
                }),
                text: (bucket) => bucket.to ?
                    `${bucket.from || 0}-${bucket.to}` :
                    `${bucket.from}+`,
            },
        };

        const query = {
            start: parseFloat(req.query.start || 0),
            filter: req.query.filter,
            source: req.query.source || req.params.sourceId || "",
            artist: req.query.artist || "",
            dateStart: req.query.dateStart,
            dateEnd: req.query.dateEnd,
            widthMin: req.query.widthMin,
            widthMax: req.query.widthMax,
            heightMin: req.query.heightMin,
            heightMax: req.query.heightMax,
        };

        const queryURL = function(options, value) {
            if (typeof options === "string") {
                const tmp = {};
                tmp[options] = value;
                options = tmp;
            }

            const params = Object.assign({}, query, options);

            for (const param in params) {
                if (!params[param]) {
                    delete params[param];
                }
            }

            if (Object.keys(params).length === 1 && "source" in params) {
                return Source.getSource(params.source)
                    .getURL(res.locals.lang);
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

        if (query.widthMin) {
            matches.push({
                range: {
                    "dimensions.width": {
                        gte: parseFloat(query.widthMin),
                    },
                },
            });
        }

        if (query.widthMax) {
            matches.push({
                range: {
                    "dimensions.width": {
                        lte: parseFloat(query.widthMax),
                    },
                },
            });
        }

        if (query.heightMin) {
            matches.push({
                range: {
                    "dimensions.height": {
                        gte: parseFloat(query.heightMin),
                    },
                },
            });
        }

        if (query.heightMax) {
            matches.push({
                range: {
                    "dimensions.height": {
                        lte: parseFloat(query.heightMax),
                    },
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
            aggs: Object.keys(facets).reduce((obj, name) => {
                obj[name] = facets[name].agg;
                return obj;
            }, {}),
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

            const aggregations = results.aggregations;
            const facetData = Object.keys(aggregations).map((name) => ({
                name: facets[name].name(res),
                buckets: aggregations[name].buckets.map((bucket) => ({
                    text: facets[name].text(bucket),
                    url: facets[name].url(bucket),
                    count: bucket.doc_count,
                })).filter((bucket) => bucket.count > 0),
            })).filter((facet) => facet.buckets.length > 1);

            res.render("artworks/index", Object.assign({
                sources: Source.getSources(),
                query: query,
                queryURL: queryURL,
                minDate: process.env.DEFAULT_START_DATE,
                maxDate: process.env.DEFAULT_END_DATE,
                facets: facetData,
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

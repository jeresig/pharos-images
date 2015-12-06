"use strict";

const dateMatch = (query) => {
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

    return {
        bool: {
            should: [
                startInside,
                endInside,
                contains,
            ],
        },
    };
};

module.exports = {
    start: {
        value: (req) => parseFloat(req.query.start),
        defaultValue: (req) => 0,
    },

    rows: {
        value: (req) => parseFloat(req.query.rows),
        defaultValue: (req) => parseFloat(process.env.DEFAULT_ROWS),
    },

    sort: {
        value: (req) => req.query.sort,
        defaultValue: (req) => process.env.DEFAULT_SORT,
    },

    filter: {
        value: (req) => req.query.filter,
        match: (query) => ({
            query_string: {
                query: query.filter || "*",
                default_operator: "and",
            },
        }),
    },

    source: {
        value: (req) => req.query.source || req.params.sourceId || "",
        match: (query) => ({
            match: {
                source: {
                    query: query.source,
                    operator: "or",
                    zero_terms_query: "all",
                },
            },
        }),
    },

    artist: {
        value: (req) => req.query.artist || "",
        match: (query) => ({
            multi_match: {
                fields: ["artists.*"],
                query: query.artist,
                operator: "and",
                zero_terms_query: "all",
            },
        }),
    },

    dateStart: {
        value: (req) => req.query.dateStart,
        match: dateMatch,
    },

    dateEnd: {
        value: (req) => req.query.dateEnd,
        match: (query) => {
            if (!query.dateStart) {
                return dateMatch(query);
            }
        },
    },

    widthMin: {
        value: (req) => req.query.widthMin,
        match: (query) => ({
            range: {
                "dimensions.width": {
                    gte: parseFloat(query.widthMin),
                },
            },
        }),
    },

    widthMax: {
        value: (req) => req.query.widthMax,
        match: (query) => ({
            range: {
                "dimensions.width": {
                    lte: parseFloat(query.widthMax),
                },
            },
        }),
    },

    heightMin: {
        value: (req) => req.query.heightMin,
        match: (query) => ({
            range: {
                "dimensions.height": {
                    gte: parseFloat(query.heightMin),
                },
            },
        }),
    },

    heightMax: {
        value: (req) => req.query.heightMax,
        match: (query) => ({
            range: {
                "dimensions.height": {
                    lte: parseFloat(query.heightMax),
                },
            },
        }),
    },
};

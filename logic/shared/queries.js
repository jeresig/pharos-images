"use strict";

const pd = require("parse-dimensions");

const types = require("./types");

// NOTE(jeresig): There has got to be a better way to handle this.
const dateMatch = (query) => {
    const start = query.dateStart || -10000;
    const end = query.dateEnd || (new Date).getYear() + 1900;

    const startInside = {
        bool: {
            must: [
                {
                    range: {
                        "dates.start": {
                            lte: parseFloat(start),
                        },
                    },
                },

                {
                    range: {
                        "dates.end": {
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
                        "dates.start": {
                            lte: parseFloat(end),
                        },
                    },
                },

                {
                    range: {
                        "dates.end": {
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
                        "dates.start": {
                            gte: parseFloat(start),
                        },
                    },
                },

                {
                    range: {
                        "dates.end": {
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

const dateFormat = (req, query) => {
    const range = req.numRange({
        from: query.dateStart,
        to: query.dateEnd,
    });

    return req.format(req.gettext("Dates: %(range)s"), {range});
};

const widthFormat = (req, query) => {
    const unit = req.unit();
    const range = req.numRange({
        from: query.widthMin,
        to: query.widthMax,
        unit,
    });

    return req.format(req.gettext("Width: %(range)s"), {range});
};

const heightFormat = (req, query) => {
    const unit = req.unit();
    const range = req.numRange({
        from: query.heightMin,
        to: query.heightMax,
        unit,
    });

    return req.format(req.gettext("Height: %(range)s"), {range});
};

module.exports = (core, app) => ({
    start: {
        value: (req) => parseFloat(req.query.start),
        defaultValue: (req) => 0,
        secondary: true,
    },

    rows: {
        value: (req) => parseFloat(req.query.rows),
        defaultValue: (req) => parseFloat(process.env.DEFAULT_ROWS || "100"),
        secondary: true,
    },

    sort: {
        value: (req) => req.query.sort,
        defaultValue: (req) => process.env.DEFAULT_SORT || "dateAsc",
        secondary: true,
    },

    filter: {
        value: (req) => req.query.filter,
        title: (req, query) => req.format(
            req.gettext("Query: '%(query)s'"),
                {query: query.filter || "*"}),
        match: (query) => ({
            query_string: {
                query: query.filter || "*",
                default_operator: "and",
            },
        }),
    },

    source: {
        value: (req) => req.query.source || req.params.source || "",
        title: (req, query) => core.models.Source.getSource(query.source)
            .getFullName(req.lang),
        url: (req, query) => core.models.Source.getSource(query.source)
            .getURL(req.lang),
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

    type: {
        value: (req) => req.query.type || req.params.type || "",
        title: (req, query) => types[query.type].name(req),
        url: (req, query) => core.urls.gen(req.lang, `/type/${query.type}`),
        match: (query) => ({
            match: {
                "objectType.raw": {
                    query: query.type,
                    operator: "or",
                    zero_terms_query: "all",
                },
            },
        }),
    },

    artist: {
        value: (req) => req.query.artist || "",
        title: (req, query) => req.format(
            req.gettext("Artist: %(artist)s"), {artist: query.artist}),
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
        pair: "dateEnd",
        value: (req) => req.query.dateStart,
        title: dateFormat,
        match: dateMatch,
    },

    dateEnd: {
        pair: "dateStart",
        value: (req) => req.query.dateEnd,
        title: dateFormat,
        match: (query) => {
            if (!query.dateStart) {
                return dateMatch(query);
            }
        },
    },

    widthMin: {
        pair: "widthMax",
        value: (req) => req.query.widthMin,
        title: widthFormat,
        match: (query) => ({
            range: {
                "dimensions.width": {
                    gte: pd.convertNumber(
                        parseFloat(query.widthMin), query.unit, "mm"),
                },
            },
        }),
    },

    widthMax: {
        pair: "widthMin",
        value: (req) => req.query.widthMax,
        title: widthFormat,
        match: (query) => ({
            range: {
                "dimensions.width": {
                    lte: pd.convertNumber(
                        parseFloat(query.widthMax), query.unit, "mm"),
                },
            },
        }),
    },

    heightMin: {
        pair: "heightMax",
        value: (req) => req.query.heightMin,
        title: heightFormat,
        match: (query) => ({
            range: {
                "dimensions.height": {
                    gte: pd.convertNumber(
                        parseFloat(query.heightMin), query.unit, "mm"),
                },
            },
        }),
    },

    heightMax: {
        pair: "heightMin",
        value: (req) => req.query.heightMax,
        title: heightFormat,
        match: (query) => ({
            range: {
                "dimensions.height": {
                    lte: pd.convertNumber(
                        parseFloat(query.heightMax), query.unit, "mm"),
                },
            },
        }),
    },

    unit: {
        value: (req) => req.query.unit,
        defaultValue: (req) => req.defaultUnit(),
        secondary: true,
    },

    hasLink: {
        value: (req) => req.query.hasLink || "",
        title: (req, query) => req.gettext("Links to Another Artwork"),
        match: (query) => ({
            range: {
                "similarArtworks.score": {
                    gte: 1,
                },
            },
        }),
    },

    hasExternalLink: {
        value: (req) => req.query.hasExternalLink || "",
        title: (req, query) => req.gettext("Links to an External Artwork"),
        match: (query) => ({
            match: {
                "similarArtworks.source": {
                    query: core.models.Source.getSources().map((source) =>
                        source._id).filter((id) => id !== query.source),
                    operator: "or",
                },
            },
        }),
    },

    hasInternalLink: {
        value: (req) => req.query.hasInternalLink || "",
        title: (req, query) => req.gettext("Links to an Internal Artwork"),
        match: (query) => ({
            match: {
                "similarArtworks.source": {
                    query: query.source,
                    operator: "or",
                },
            },
        }),
    },
});

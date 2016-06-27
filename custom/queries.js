"use strict";

const sanitize = require("elasticsearch-sanitize");
const pd = require("parse-dimensions");

const types = require("./types");

const escape = (str) => sanitize(str).replace(/\\ /g, " ");

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

module.exports = {
    location: {
        value: (req) => req.query.location,
        title: (req, query) => req.format(
            req.gettext("Location: '%(query)s'"), {query: query.location}),
        match: (query) => ({
            match: {
                "locations.name": {
                    query: escape(query.location),
                    operator: "and",
                    zero_terms_query: "all",
                },
            },
        }),
    },

    type: {
        value: (req) => req.query.type || "",
        title: (req, query) => types[query.type].name(req),
        url: (query) => `/type/${encodeURIComponent(query.type)}`,
        match: (query) => ({
            match: {
                "objectType.raw": {
                    query: escape(query.type),
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
                fields: ["artists.name"],
                query: escape(query.artist),
                operator: "and",
                zero_terms_query: "all",
            },
        }),
    },

    medium: {
        value: (req) => req.query.medium || "",
        title: (req, query) => req.format(
            req.gettext("Medium: %(medium)s"), {medium: query.medium}),
        match: (query) => ({
            match: {
                "medium": {
                    query: escape(query.medium),
                    operator: "or",
                    zero_terms_query: "all",
                },
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
};

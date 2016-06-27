"use strict";

const models = require("../../lib/models");
const config = require("../../lib/config");

module.exports = Object.assign({
    start: {
        value: (req) => parseFloat(req.query.start),
        defaultValue: () => 0,
        secondary: true,
    },

    rows: {
        value: (req) => parseFloat(req.query.rows),
        defaultValue: () => parseFloat(config.DEFAULT_ROWS),
        secondary: true,
    },

    sort: {
        value: (req) => req.query.sort,
        defaultValue: () => config.DEFAULT_SORT,
        secondary: true,
    },

    filter: {
        value: (req) => req.query.filter,
        title: (req, query) => req.format(
            req.gettext("Query: '%(query)s'"), {query: query.filter}),
        match: (query) => ({
            query_string: {
                query: query.filter,
                default_operator: "and",
            },
        }),
    },

    source: {
        value: (req) => req.query.source || "",
        title: (req, query) => models("Source").getSource(query.source)
            .getFullName(req.lang),
        url: (query) => models("Source").getSource(query.source),
        match: (query) => ({
            match: {
                source: {
                    query: escape(query.source),
                    operator: "or",
                    zero_terms_query: "all",
                },
            },
        }),
    },

    similar: {
        filters: {
            any: {
                getTitle: (req) => req.gettext("Similar to Any Artwork"),
                match: () => ({
                    range: {
                        "similarArtworks.score": {
                            gte: 1,
                        },
                    },
                }),
            },

            external: {
                getTitle: (req) =>
                    req.gettext("Similar to an External Artwork"),
                match: () => {
                    const sourceIDs = models("Source").getSources()
                        .map((source) => source._id);
                    const should = sourceIDs.map((sourceID) => ({
                        bool: {
                            must: [
                                {
                                    match: {
                                        source: sourceID,
                                    },
                                },
                                {
                                    match: {
                                        "similarArtworks.source": {
                                            query: sourceIDs
                                                .filter((id) => id !== sourceID)
                                                .join(" "),
                                            operator: "or",
                                        },
                                    },
                                },
                            ],
                        },
                    }));

                    return {bool: {should}};
                },
            },

            internal: {
                getTitle: (req) =>
                    req.gettext("Similar to an Internal Artwork"),
                match: () => {
                    const sourceIDs = models("Source").getSources()
                        .map((source) => source._id);
                    const should = sourceIDs.map((sourceID) => ({
                        bool: {
                            must: [
                                {
                                    match: {
                                        source: sourceID,
                                    },
                                },
                                {
                                    match: {
                                        "similarArtworks.source": {
                                            query: sourceID,
                                            operator: "or",
                                        },
                                    },
                                },
                            ],
                        },
                    }));

                    return {bool: {should}};
                },
            },
        },
        value: (req) => req.query.similar || "",
        title(req, query) {
            return this.filters[query.similar].getTitle(req);
        },
        match(query) {
            return this.filters[query.similar].match(query);
        },
    },
}, config.queries);

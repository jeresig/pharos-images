"use strict";

const models = require("../../lib/models");
const config = require("../../lib/config");

module.exports = Object.assign({
    start: {
        value: (fields) => parseFloat(fields.start),
        defaultValue: () => 0,
        secondary: true,
    },

    rows: {
        value: (fields) => parseFloat(fields.rows),
        defaultValue: () => parseFloat(config.DEFAULT_ROWS),
        secondary: true,
    },

    sort: {
        value: (fields) => fields.sort,
        defaultValue: () => config.DEFAULT_SORT,
        secondary: true,
    },

    filter: {
        value: (fields) => fields.filter,
        title: (req, query) => req.format(
            req.gettext("Query: '%(query)s'"), {query: query.filter}),
        filter: (query) => ({
            query_string: {
                query: query.filter,
                default_operator: "and",
            },
        }),
    },

    source: {
        value: (fields) => fields.source || "",
        title: (req, query) => models("Source").getSource(query.source)
            .getFullName(req.lang),
        url: (query) => models("Source").getSource(query.source),
        filter: (query) => ({
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
        value: (fields) => fields.similar || "",
        title(req, query) {
            return this.filters[query.similar].getTitle(req);
        },
        filter(query) {
            return this.filters[query.similar].match(query);
        },
    },
}, config.model);

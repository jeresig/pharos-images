"use strict";

const config = require("../../lib/config");
const models = require("../../lib/models");

const facets = {
    source: {
        title: (i18n) => i18n.gettext("Source"),

        facet: () => ({
            terms: {
                field: "source",
            },
        }),

        formatBuckets: (buckets) => buckets.map((bucket) => ({
            text: models("Source").getSource(bucket.key).name,
            count: bucket.doc_count,
            url: {source: bucket.key},
        })),
    },
};

for (const name in config.model) {
    const model = config.model[name];

    if (model.facet) {
        Object.assign(facets, model.facet());
    }
}

module.exports = facets;

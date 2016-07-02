"use strict";

const config = require("../../lib/config");
const models = require("../../lib/models");

module.exports = Object.assign({
    source: {
        name: (i18n) => i18n.gettext("Source"),

        formatFacetBucket(bucket, searchURL) {
            return {
                text: models("Source").getSource(bucket.key).name,
                url: searchURL({source: bucket.key}),
            };
        },

        facet() {
            return {
                terms: {
                    field: "source",
                },
            };
        },
    },
}, config.model);

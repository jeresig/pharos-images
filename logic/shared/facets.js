"use strict";

const config = require("../../lib/config");
const models = require("../../lib/models");

const searchURL = require("./search-url").searchURL;

module.exports = Object.assign({
    source: {
        agg: {
            terms: {
                field: "source",
            },
        },
        name: (req) => req.gettext("Source"),
        url: (req, bucket) => searchURL(req, {source: bucket.key}),
        text: (req, bucket) => models("Source").getSource(bucket.key).name,
    },
}, config.facets);

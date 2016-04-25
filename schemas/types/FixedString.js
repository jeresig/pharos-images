"use strict";

const FixedStringFilter = require("../../views/types/filter/FixedString.jsx");
const FixedStringDisplay = require("../../views/types/view/FixedString.jsx");

const FixedString = (options) => {
    this.options = options;
    /*
    name
    modelName
    values: [String]
    title(i18n)
    placeholder(i18n)
    */
};

FixedString.prototype = {
    modelName() {
        return this.options.modelName || this.options.name;
    },

    value(req) {
        return req.query[this.options.name];
    },

    searchTitle(query, i18n) {
        const title = this.options.title(i18n);
        return `${title}: ${query[this.options.name]}`;
    },

    url(query) {
        return `/type/${encodeURIComponent(query[this.options.name])}`;
    },

    filter(query, sanitize) {
        return {
            match: {
                [`${this.modelName()}.raw`]: {
                    query: sanitize(query[this.options.name]),
                    operator: "or",
                    zero_terms_query: "all",
                },
            },
        };
    },

    renderFilter(query, i18n) {
        return FixedStringFilter({
            placeholder: this.options.placeholder(i18n),
            title: this.options.title(i18n),
            value: query[this.options.name],
        });
    },

    renderView(data, searchURL) {
        return FixedStringDisplay({
            locations: data[this.modelName()],
            name: this.options.name,
            searchURL,
        });
    },

    schema() {
        return {
            type: String,
            es_indexed: true,
            es_type: "multi_field",
            // A raw type to use for building aggregations in Elasticsearch
            es_fields: {
                name: {type: "string", index: "analyzed"},
                raw: {type: "string", index: "not_analyzed"},
            },
            recommended: true,
            validate: (val) =>
                Object.keys(this.options.values).indexOf(val) >= 0,
            validationMsg: (req) => req.format(req.gettext("`%(name)s` " +
                "must be one of the following values: %(values)s."), {
                    name: this.options.name,
                    values: Object.keys(this.options.values).join(", "),
                }),
        };
    },
};

module.exports = FixedString;

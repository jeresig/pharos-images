"use strict";

const FixedStringFilter = require("../../views/types/filter/FixedString.jsx");
const FixedStringDisplay = require("../../views/types/view/FixedString.jsx");

const FixedString = (options) => {
    this.options = options;
    /*
    name
    modelName
    allowUnknown: Bool
    values: {Key: title(i18n)}
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
        const value = query[this.options.name];
        const values = this.options.values || {};

        // If there is a value that has an i18n title mapping
        if (values && typeof values[value] === "function") {
            return values[value](i18n);
        }

        return value;
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

    facet() {
        return {
            terms: {
                field: `${this.modelName()}.raw`,
            },
        };
    },

    formatFacetBucket(bucket, searchURL, i18n) {
        return {
            text: (bucket.key in this.options.values ?
                this.options.values[bucket.key](i18n) :
                bucket.key),
            url: searchURL({
                [this.props.name]: bucket.key,
            }),
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
        let validate = {};
        const values = Array.isArray(this.options.values) ?
            this.options.values :
            Object.keys(this.options.values);

        // Only validate the values if there are values to validate against
        // and if unknown values aren't allowed
        if (values.length > 0 && !this.options.allowUnknown) {
            validate = {
                validate: (val) => values.indexOf(val) >= 0,
                validationMsg: (req) => req.format(req.gettext("`%(name)s` " +
                    "must be one of the following values: %(values)s."), {
                        name: this.options.name,
                        values: values.join(", "),
                    }),
            };
        }

        return Object.assign({
            type: String,
            es_indexed: true,
            es_type: "multi_field",
            // A raw type to use for building aggregations in Elasticsearch
            es_fields: {
                name: {type: "string", index: "analyzed"},
                raw: {type: "string", index: "not_analyzed"},
            },
        }, validate);
    },
};

module.exports = FixedString;

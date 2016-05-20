"use strict";

//const SimpleStringFilter =
//    require("../../views/types/filter/SimpleString.jsx");
//const SimpleStringDisplay =
//    require("../../views/types/view/SimpleString.jsx");

const SimpleString = function(options) {
    this.options = options;
    /*
    name
    modelName
    title(i18n)
    placeholder(i18n)
    recommended: Bool
    */
};

SimpleString.prototype = {
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

    /*
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
        return SimpleStringFilter({
            placeholder: this.options.placeholder(i18n),
            title: this.options.title(i18n),
            value: query[this.options.name],
            values: Object.keys(this.options.values).map((id) => ({
                id,
                name: this.options.values[id],
            })),
        });
    },

    renderView(data, searchURL) {
        return SimpleStringDisplay({
            locations: data[this.modelName()],
            name: this.options.name,
            searchURL,
        });
    },
    */

    schema() {
        return {
            type: String,
            es_indexed: true,
            recommended: !!this.options.recommended,
        };
    },
};

module.exports = SimpleString;

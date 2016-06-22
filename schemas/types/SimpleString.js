"use strict";

const React = require("react");

const FixedStringDisplay = React.createFactory(
    require("../../views/types/view/FixedString.jsx"));

const SimpleString = function(options) {
    this.options = options;
    /*
    name
    modelName
    title(i18n)
    placeholder(i18n)
    multiple: Bool
    recommended: Bool
    searchField: String
    */
};

SimpleString.prototype = {
    modelName() {
        return this.options.modelName || this.options.name;
    },

    value(req) {
        return req.query[this.options.name];
    },

    fields() {
        return [this.options.name];
    },

    renderView(data, searchURL) {
        return FixedStringDisplay({
            value: data[this.modelName()],
            name: this.options.name,
            searchField: this.options.searchField,
            searchURL,
        });
    },

    schema() {
        const type = {
            type: String,
            es_indexed: true,
            recommended: !!this.options.recommended,
        };

        return this.options.multiple ? [type] : type;
    },
};

module.exports = SimpleString;

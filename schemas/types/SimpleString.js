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
    multiple: Bool
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

    /*
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
        const type = {
            type: String,
            es_indexed: true,
            recommended: !!this.options.recommended,
        };

        return this.options.multiple ? [type] : type;
    },
};

module.exports = SimpleString;

"use strict";

const React = require("react");

const LocationFilter = React.createFactory(
    require("../../views/types/filter/Location.jsx"));
const LocationDisplay = React.createFactory(
    require("../../views/types/view/Location.jsx"));

const Location = function(options) {
    this.options = options;
    /*
    name
    modelName
    title(i18n)
    placeholder(i18n)
    */
};

Location.prototype = {
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

    filter(query, sanitize) {
        return {
            match: {
                [`${this.modelName()}.name`]: {
                    query: sanitize(query[this.options.name]),
                    operator: "and",
                    zero_terms_query: "all",
                },
            },
        };
    },

    renderFilter(query, i18n) {
        return LocationFilter({
            name: this.options.name,
            placeholder: this.options.placeholder(i18n),
            title: this.options.title(i18n),
            value: query[this.options.name],
        });
    },

    renderView(data, searchURL) {
        return LocationDisplay({
            value: data[this.modelName()],
            name: this.options.name,
            searchURL,
        });
    },

    schema(Schema) {
        const LocationSchema = new Schema({
            // An ID for the name, computed from all the properties
            // before validation.
            _id: String,

            // The country and city representing the location
            country: {type: String, es_indexed: true},
            city: {type: String, es_indexed: true},

            // The name of the location
            name: {type: String, es_indexed: true},
        });

        // Dynamically generate the _id attribute
        LocationSchema.pre("validate", function(next) {
            this._id = [this.country, this.city, this.name].join(",");
            next();
        });

        return {
            type: [LocationSchema],
            validateArray: (location) => location.name || location.city,
            validationMsg: (i18n) => i18n.gettext("Locations must have a " +
                "name or city specified."),
        };
    },
};

module.exports = Location;

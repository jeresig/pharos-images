"use strict";

const React = require("react");

const YearRange = require("./YearRange.js");

const NameFilter = React.createFactory(
    require("../../views/types/filter/Name.jsx"));
const NameDisplay = React.createFactory(
    require("../../views/types/view/Name.jsx"));

const Name = function(options) {
    this.options = options;
    /*
    name
    modelName
    title(i18n)
    placeholder(i18n)
    */
};

Name.prototype = {
    modelName() {
        return this.options.modelName || this.options.name;
    },

    value(req) {
        return req.query[this.options.name];
    },

    fields() {
        return [this.options.name];
    },

    searchTitle(query, i18n) {
        const title = this.options.title(i18n);
        return `${title}: ${query[this.options.name]}`;
    },

    filter(query, sanitize) {
        return {
            multi_match: {
                fields: [`${this.modelName()}.name`],
                query: sanitize(query[this.options.name]),
                operator: "and",
                zero_terms_query: "all",
            },
        };
    },

    facet() {
        // TODO: Make the number of facets configurable
        return {
            terms: {
                field: `${this.modelName()}.name.raw`,
                size: 50,
            },
        };
    },

    formatFacetBucket(bucket, searchURL) {
        return {
            text: bucket.key,
            url: searchURL({
                [this.props.name]: bucket.key,
            }),
        };
    },

    renderFilter(query, i18n) {
        return NameFilter({
            name: this.options.name,
            placeholder: this.options.placeholder(i18n),
            title: this.options.title(i18n),
            value: query[this.options.name],
        });
    },

    renderView(data, searchURL) {
        return NameDisplay({
            name: this.options.name,
            value: data[this.modelName()],
            searchURL,
        });
    },

    schema(Schema) {
        const NameSchema = new Schema({
            // An ID for the name, computed from the original + name properties
            // before validation.
            _id: String,

            // The original string from which the rest of the values were
            // derived
            original: String,

            // The locale for the string (e.g. 'en', 'ja')
            locale: String,

            // Any sort of name parsing options
            settings: Schema.Types.Mixed,

            // The English form of the full artist's name
            name: {
                type: String,
                es_indexed: true,
                es_type: "multi_field",
                // A raw name to use for building aggregations in Elasticsearch
                es_fields: {
                    name: {type: "string", index: "analyzed"},
                    raw: {type: "string", index: "not_analyzed"},
                },
                required: true,
            },

            // Same but in ascii (for example: Hokushō becomes Hokushoo)
            ascii: String,

            // Same but with diacritics stripped (Hokushō becomes Hokusho)
            plain: {type: String, es_indexed: true},

            // The English form of the middle name
            middle: String,

            // The English form of the surname
            surname: String,

            // A number representing the generation of the artist
            generation: Number,

            // A pseudonym for the person
            pseudonym: {type: String, es_indexed: true},

            // Is the artist unknown/unattributed
            unknown: Boolean,

            // Is this artist part of a school
            school: Boolean,

            // Was this work done in the style of, or after, an artist
            after: Boolean,

            // Is this work attributed to an artist
            attributed: Boolean,

            // Date when the name was used
            dates: YearRange.prototype.schema(Schema),
        });

        // Dynamically generate the _id attribute
        NameSchema.pre("validate", function(next) {
            this._id = this.original || this.name;
            next();
        });

        return {
            type: [NameSchema],
            convert: (obj) => typeof obj === "string" ?
                {name: obj} : obj,
        };
    },
};

module.exports = Name;

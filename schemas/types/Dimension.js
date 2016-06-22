"use strict";

const pd = require("parse-dimensions");
const React = require("react");

const DimensionFilter = React.createFactory(
    require("../../views/types/filter/Dimension.jsx"));
const DimensionDisplay = React.createFactory(
    require("../../views/types/view/Dimension.jsx"));

const numRange = (bucket) => bucket.to ?
    `${bucket.from || 0}-${bucket.to}${bucket.unit}` :
    `${bucket.from}${bucket.unit}+`;

const Dimension = function(options) {
    this.options = options;
    /*
    name
    modelName
    title(i18n)
    widthTitle(i18n)
    heightTitle(i18n)
    placeholder(i18n)
    */
};

Dimension.prototype = {
    modelName() {
        return this.options.modelName || this.options.name;
    },

    value(req) {
        const config = require("../../lib/config");

        const heightMin = req.query[`${this.options.name}.height.min`];
        const heightMax = req.query[`${this.options.name}.height.max`];
        const widthMin = req.query[`${this.options.name}.width.min`];
        const widthMax = req.query[`${this.options.name}.width.max`];
        const unit = req.query[`${this.options.name}.unit`] ||
            config.DEFAULT_SEARCH_UNIT || config.DEFAULT_UNIT;

        if (heightMin || heightMax || widthMin || widthMax) {
            return {heightMin, heightMax, widthMin, widthMax, unit};
        }
    },

    fields() {
        return [
            `${this.options.name}.height.min`,
            `${this.options.name}.height.max`,
            `${this.options.name}.width.min`,
            `${this.options.name}.width.max`,
            `${this.options.name}.unit`,
        ];
    },

    breadcrumb(query, searchURL, i18n) {
        const breadcrumbs = [];
        const value = query[this.options.name];

        if (value.heightMin || value.heightMax) {
            const title = this.options.heightTitle(i18n);
            const range = numRange({
                from: value.heightMin,
                to: value.heightMax,
                unit: value.unit,
            });

            breadcrumbs.push({
                title: `${title}: ${range}`,
                url: searchURL({
                    heightMin: value.heightMin,
                    heightMax: value.heightMax,
                }),
            });
        }

        if (value.widthMin || value.widthMax) {
            const title = this.options.widthTitle(i18n);
            const range = numRange({
                from: value.widthMin,
                to: value.widthMax,
                unit: value.unit,
            });

            breadcrumbs.push({
                title: `${title}: ${range}`,
                url: searchURL({
                    widthMin: value.widthMin,
                    widthMax: value.widthMax,
                }),
            });
        }

        return breadcrumbs;
    },

    filter(query) {
        const config = require("../../lib/config");

        const filters = [];
        const value = query[this.options.name];

        if (value.widthMin) {
            filters.push({
                range: {
                    "dimensions.width": {
                        gte: pd.convertNumber(
                            parseFloat(value.widthMin), value.unit,
                                config.DEFAULT_UNIT),
                    },
                },
            });
        }

        if (value.widthMax) {
            filters.push({
                range: {
                    "dimensions.width": {
                        lte: pd.convertNumber(
                            parseFloat(value.widthMax), value.unit,
                                config.DEFAULT_UNIT),
                    },
                },
            });
        }

        if (value.heightMin) {
            filters.push({
                range: {
                    "dimensions.height": {
                        gte: pd.convertNumber(
                            parseFloat(query.heightMin), query.unit,
                                config.DEFAULT_UNIT),
                    },
                },
            });
        }

        if (value.heightMax) {
            filters.push({
                range: {
                    "dimensions.height": {
                        lte: pd.convertNumber(
                            parseFloat(query.heightMax), query.unit,
                                config.DEFAULT_UNIT),
                    },
                },
            });
        }

        return filters;
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
        return DimensionFilter({
            name: this.options.name,
            placeholder: this.options.placeholder(i18n),
            heightTitle: this.options.heightTitle(i18n),
            widthTitle: this.options.widthTitle(i18n),
            value: query[this.options.name],
        });
    },

    renderView(data, searchURL) {
        const config = require("../../lib/config");

        return DimensionDisplay({
            value: data[this.modelName()],
            name: this.options.name,
            defaultUnit: config.DEFAULT_SEARCH_UNIT,
            searchURL,
        });
    },

    schema(Schema) {
        const config = require("../../lib/config");

        const DimensionSchema = new Schema({
            // An ID for the dimension, computed from the original +
            // width/height properties before validation.
            _id: String,

            // The source string from which the dimensions were generated
            original: String,

            // The width/height/depth of the object (stored in millimeters)
            width: {type: Number, es_indexed: true},
            height: {type: Number, es_indexed: true},
            depth: {type: Number, es_indexed: true},

            // A label for the dimensions (e.g. "with frame")
            label: String,

            // The unit for the dimensions (defaults to millimeters)
            unit: {type: String, es_indexed: true},
        });

        DimensionSchema.methods = {
            toJSON() {
                const obj = this.toObject();
                delete obj.original;
                return obj;
            },
        };

        // Dynamically generate the _id attribute
        DimensionSchema.pre("validate", function(next) {
            this._id = this.original ||
                [this.width, this.height, this.unit].join(",");
            next();
        });

        return {
            type: [DimensionSchema],
            convert: (obj) => typeof obj === "string" ?
                pd.parseDimension(obj, true, config.DEFAULT_UNIT) :
                pd.convertDimension(obj, config.DEFAULT_UNIT),
            validateArray: (val) => (val.width || val.height) && val.unit,
            validationMsg: (req) => req.gettext("Dimensions must have a " +
                "unit specified and at least a width or height."),
        };
    },
};

module.exports = Dimension;

"use strict";

const pd = require("parse-dimensions");

const config = require("../../lib/config");

const DimensionFilter = require("../../views/types/filter/Dimension.jsx");
const DimensionDisplay = require("../../views/types/view/Dimension.jsx");

const numRange = (bucket) => bucket.to ?
    `${bucket.from || 0}-${bucket.to}${bucket.unit}` :
    `${bucket.from}${bucket.unit}+`;

const Dimension = (options) => {
    this.options = options;
    /*
    name
    modelName
    title(i18n)
    placeholder(i18n)
    */
};

Dimension.prototype = {
    modelName() {
        return this.options.modelName || this.options.name;
    },

    value(req) {
        const heightMin = req.query[`${this.options.name}.heightMin`];
        const heightMax = req.query[`${this.options.name}.heightMax`];
        const widthMin = req.query[`${this.options.name}.widthMin`];
        const widthMax = req.query[`${this.options.name}.widthMax`];
        const unit = req.query[`${this.options.name}.unit`] ||
            config.DEFAULT_SEARCH_UNIT || config.DEFAULT_UNIT;

        if (heightMin || heightMax || widthMin || widthMax) {
            return {heightMin, heightMax, widthMin, widthMax, unit};
        }
    },

    searchTitle(query, i18n) {
        const title = this.options.title(i18n);
        const value = query[this.options.name];
        const range = numRange({
            from: value.start,
            to: value.end,
            unit: value.unit,
        });

        return `${title}: ${range}`;
    },

    filter(query) {
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

    renderFilter(query, i18n) {
        return DimensionFilter({
            placeholder: this.options.placeholder(i18n),
            title: this.options.title(i18n),
            value: query[this.options.name],
        });
    },

    renderView(data, searchURL) {
        return DimensionDisplay({
            locations: data[this.modelName()],
            name: this.options.name,
            searchURL,
        });
    },

    schema(Schema) {
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

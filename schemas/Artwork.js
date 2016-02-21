"use strict";

const async = require("async");
const parseDimensions = require("parse-dimensions");
const yearRange = require("yearrange");
const validUrl = require("valid-url");

const locales = require("../config/locales.json");
const types = require("../logic/shared/types.js");

module.exports = (core) => {
    const Name = require("./Name")(core);
    const YearRange = require("./YearRange")(core);
    const Dimension = require("./Dimension")(core);
    const Location = require("./Location")(core);

    const Artwork = new core.db.schema({
        // UUID of the image (Format: SOURCE/ID)
        _id: {
            type: String,
            es_indexed: true,
        },

        // Source ID
        id: {
            type: String,
            validate: (v) => /^[a-z0-9_-]+$/i.test(v),
            validationMsg: (req) => req.gettext("IDs can only contain " +
                "letters, numbers, underscores, and hyphens."),
            required: true,
            es_indexed: true,
        },

        // The date that this item was created
        created: {
            type: Date,
            default: Date.now,
        },

        // The date that this item was updated
        modified: Date,

        // The most recent batch in which the artwork data was uploaded
        batch: {
            type: String,
            ref: "ArtworkImport",
        },

        // The source of the image.
        // NOTE: We don't need to validate the source as it's not a
        // user-specified property.
        source: {
            type: String,
            es_indexed: true,
            required: true,
        },

        // The language of the page from where the data is being extracted. This
        // will influence how extracted text is handled.
        lang: {
            type: String,
            required: true,
            validate: (v) => Object.keys(locales).indexOf(v) >= 0,
            validationMsg: (req) => req.format(req.gettext("`lang` must only " +
                "be one of following languages: %(langs)s."), {
                    langs: Object.keys(locales).join(", "),
                }),
        },

        // A link to the artwork at its source
        url: {
            type: String,
            required: true,
            validate: (v) => validUrl.isHttpsUri(v) || validUrl.isHttpUri(v),
            validationMsg: (req) => req.gettext("`url` must be properly-" +
                "formatted URL."),
        },

        // A hash to use to render an image representing the artwork
        defaultImageHash: {
            type: String,
            required: true,
        },

        // The images associated with the artwork
        images: {
            type: [{type: String, ref: "Image"}],
            required: true,
            validateArray: (v) => /^\w+\/[a-z0-9_-]+\.jpe?g$/i.test(v),
            validationMsg: (req) => req.gettext("Images must be a valid " +
                "image file name. For example: `image.jpg`."),
            convert: (name, data) => `${data.source}/${name}`,
        },

        // The title of the artwork.
        title: {
            type: String,
            es_indexed: true,
            recommended: true,
        },

        // A list of artist names extracted from the page.
        artists: {
            type: [Name],
            convert: (obj) => typeof obj === "string" ?
                {name: obj} : obj,
        },

        // The size of the artwork (e.g. 100mm x 200mm)
        dimensions: {
            type: [Dimension],
            convert: (obj) => typeof obj === "string" ?
                parseDimensions.parseDimension(obj, true, "mm") :
                parseDimensions.convertDimension(obj, "mm"),
            validateArray: (val) => (val.width || val.height) && val.unit,
            validationMsg: (req) => req.gettext("Dimensions must have a " +
                "unit specified and at least a width or height."),
        },

        // Date ranges when the artwork was created or modified.
        dates: {
            type: [YearRange],
            convert: (obj) => typeof obj === "string" ?
                yearRange.parse(obj) : obj,
            validateArray: (val) => val.start || val.end,
            validationMsg: (req) => req.gettext("Dates must have a start or " +
                "end specified."),
        },

        // The English form of the object type (e.g. painting, print)
        // NOTE(jeresig): We could require that the object type be of one of a
        // the pre-specified types in the types file, but that feels overly
        // restrictive, better to just warn them instead.
        objectType: {
            type: String,
            es_indexed: true,
            es_type: "multi_field",
            // A raw type to use for building aggregations in Elasticsearch
            es_fields: {
                name: {type: "string", index: "analyzed"},
                raw: {type: "string", index: "not_analyzed"},
            },
            recommended: true,
            validate: (val) => Object.keys(types).indexOf(val) >= 0,
            validationMsg: (req) => req.format(req.gettext("`objectType` " +
                "must be one of the following types: %(types)s."), {
                    types: Object.keys(types).join(", "),
                }),
        },

        // The medium of the artwork (e.g. "watercolor")
        medium: {
            type: String,
            es_indexed: true,
        },

        // Locations where the artwork is stored
        locations: {
            type: [Location],
            validateArray: (val) => val.name || val.city,
            validationMsg: (req) => req.gettext("Locations must have a name " +
                "or city specified."),
        },

        // Categories classifying the artwork
        categories: [{
            type: String,
            es_indexed: true,
        }],

        // Computed by looking at the results of images.similarImages
        similarArtworks: [{
            _id: String,

            artwork: {
                type: String,
                ref: "Artwork",
                required: true,
            },

            images: {
                type: [String],
                required: true,
            },

            source: {
                type: String,
                es_indexed: true,
                required: true,
            },

            score: {
                type: Number,
                es_indexed: true,
                required: true,
                min: 1,
            },
        }],
    });

    Artwork.virtual("date")
        .get(function() {
            return this.dates[0];
        });

    Artwork.methods = {
        getURL(locale) {
            return core.urls.gen(locale, `/artworks/${this._id}`);
        },

        getThumbURL() {
            return core.urls.genData(
                `/${this.source}/thumbs/${this.defaultImageHash}.jpg`);
        },

        getTitle(locale) {
            const parts = [];

            if (this.title && /\S/.test(this.title)) {
                parts.push(this.title);
            }

            parts.push("-", this.getSource().getFullName(locale));

            return parts.join(" ");
        },

        getSource() {
            return core.models.Source.getSource(this.source);
        },

        updateSimilarity(callback) {
            // Calculate artwork matches before saving
            const matches = this.images
                .map((image) => image.similarImages || [])
                .reduce((a, b) => a.concat(b), []);
            const scores = matches.reduce((obj, match) => {
                obj[match.id] = Math.max(match.score, obj[match.id] || 0);
                return obj;
            }, {});

            if (matches.length === 0) {
                return callback();
            }

            const query = matches.map((match) => ({
                "images.imageName": match.id,
            }));

            core.models.Artwork.find({$or: query}, (err, artworks) => {
                if (err) {
                    return callback(err);
                }

                this.similarArtworks = artworks
                    .filter((similar) => similar._id !== this._id)
                    .map((similar) => {
                        const imageScores = similar.images.map(
                            (image) => scores[image.imageName] || 0);

                        return {
                            artwork: similar._id,
                            images: similar.images.map(
                                (image) => image._id),
                            score: imageScores.reduce((a, b) => a + b),
                            source: similar.source,
                        };
                    })
                    .filter((similar) => similar.score > 0)
                    .sort((a, b) => b.score - a.score);

                callback();
            });
        },
    };

    const internal = ["_id", "__v", "created", "modified", "defaultImageHash",
        "batch"];

    const getExpectedType = (options, value) => {
        if (Array.isArray(options.type)) {
            return Array.isArray(value) ? false : "array";
        }

        if (options.type === Number) {
            return typeof value === "number" ? false : "number";
        }

        if (options.type === Boolean) {
            return typeof value === "boolean" ? false : "boolean";
        }

        // Defaults to type of String
        return typeof value === "string" ? false : "string";
    };

    Artwork.statics = {
        fromData(data, req, callback) {
            const lint = this.lintData(data, req);
            const warnings = lint.warnings;

            if (lint.error) {
                return process.nextTick(() => callback(new Error(lint.error)));
            }

            data = lint.data;

            const _id = `${data.source}/${data.id}`;

            core.models.Artwork.findById(_id, (err, artwork) => {
                if (err) {
                    return callback(new Error(
                        req.gettext("Error locating existing artwork.")));
                }

                const creating = !artwork;

                async.mapLimit(data.images || [], 2, (fileName, callback) => {
                    const _id = `${data.source}/${fileName}`;

                    core.models.Image.findById(_id, (err, image) => {
                        if (err) {
                            return callback(err);
                        }

                        if (!image) {
                            warnings.push(`Image file not found: ${fileName}`);
                        }

                        callback(null, _id);
                    });
                }, (err, images) => {
                    /* istanbul ignore if */
                    if (err) {
                        return callback(new Error(req.gettext(
                            "Error accessing image data.")));
                    }

                    // Filter out any missing images
                    images = images.filter((image) => !!image);

                    // We handle the setting of images separately
                    delete data.images;

                    if (images.length === 0) {
                        return callback(new Error(req.gettext(
                            "No images found.")));
                    }

                    if (creating) {
                        artwork = new core.models.Artwork(data);
                    } else {
                        artwork.set(data);
                    }

                    artwork.validate((err) => {
                        /* istanbul ignore if */
                        if (err) {
                            return callback(new Error(req.gettext("There " +
                                "was an error with the data format.")));
                        }

                        callback(null, artwork, warnings);
                    });
                });
            });
        },

        lintData(data, req, schema) {
            schema = schema || Artwork;

            const cleaned = {};
            const warnings = [];
            let error;

            for (const field in data) {
                const options = schema.path(field);

                if (!options || internal.indexOf(field) >= 0) {
                    warnings.push(req.format(req.gettext(
                        "Unrecognized field `%(field)s`."), {field}));
                    continue;
                }
            }

            for (const field in schema.paths) {
                // Skip internal fields
                if (internal.indexOf(field) >= 0) {
                    continue;
                }

                let value = data[field];
                const options = schema.path(field).options;

                if (value && (value.length === undefined || value.length > 0)) {
                    const expectedType = getExpectedType(options, value);

                    if (expectedType) {
                        value = null;
                        warnings.push(req.format(req.gettext(
                            "`%(field)s` is the wrong type. Expected a " +
                            "%(type)s."), {field, type: expectedType}));

                    } else if (Array.isArray(options.type)) {
                        // Convert the value to its expected form, if a
                        // conversion method exists.
                        if (options.convert) {
                            value = value.map((obj) =>
                                options.convert(obj, data));
                        }

                        if (options.type[0].type) {
                            value = value.filter((entry) => {
                                const expectedType =
                                    getExpectedType(options.type[0], entry);

                                if (expectedType) {
                                    warnings.push(req.format(req.gettext(
                                        "`%(field)s` value is the wrong type." +
                                            " Expected a %(type)s."),
                                        {field, type: expectedType}));
                                } else {
                                    return entry;
                                }
                            });
                        } else {
                            value = value.map((entry) => {
                                const results = this.lintData(entry, req,
                                    options.type[0]);

                                if (results.error) {
                                    warnings.push(
                                        `\`${field}\`: ${results.error}`);

                                } else {
                                    for (const warning of results.warnings) {
                                        warnings.push(
                                            `\`${field}\`: ${warning}`);
                                    }

                                    return results.data;
                                }
                            }).filter((entry) => !!entry);
                        }

                        // Validate the array entries
                        if (options.validateArray) {
                            const results = value.filter((entry) =>
                                options.validateArray(entry));

                            if (value.length !== results.length) {
                                warnings.push(options.validationMsg(req));
                            }

                            value = results;
                        }

                    } else {
                        // Validate the value
                        if (options.validate && !options.validate(value)) {
                            value = null;
                            warnings.push(options.validationMsg(req));
                        }
                    }
                }

                if (!value || value.length === 0) {
                    if (options.required) {
                        error = req.format(req.gettext(
                            "Required field `%(field)s` is empty."), {field});
                        break;
                    } else if (options.recommended) {
                        warnings.push(req.format(req.gettext(
                            "Recommended field `%(field)s` is empty."),
                            {field}));
                    }
                } else {
                    cleaned[field] = value;
                }
            }

            if (error) {
                return {error, warnings};
            } else {
                return {data: cleaned, warnings};
            }
        },
    };

    // Dynamically generate the _id attribute
    Artwork.pre("validate", function(next) {
        this._id = `${this.source}/${this.id}`;
        next();
    });

    Artwork.pre("save", function(next) {
        // Always updated the modified time on every save
        this.modified = new Date();
    });

    return Artwork;
};

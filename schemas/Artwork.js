"use strict";

const async = require("async");

module.exports = (core) => {
    const Name = require("./Name")(core);
    const YearRange = require("./YearRange")(core);
    const Dimension = require("./Dimension")(core);
    const Location = require("./Location")(core);
    const Image = require("./Image")(core);

    const Artwork = new core.db.schema({
        // UUID of the image (Format: SOURCE/ID)
        _id: {
            type: String,
            validate: (v) => /^\w+\/.+$/.test(v),
            es_indexed: true,
        },

        // Source ID
        id: {
            type: String,
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

        // The source of the image.
        // NOTE(jeresig): It'd be nice to validate and ensure that the source
        // is one that actually exists.
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
            // NOTE(jeresig): Need to find a way to update this dynamically.
            enum: ["en", "it", "de"],
        },

        // A link to the artwork at its source
        // TODO(jeresig): Use a better URL validator.
        url: {
            type: String,
            required: true,
            validate: (v) => /^https?:\/\/.*/.test(v),
        },

        // A hash to use to render an image representing the artwork
        defaultImageHash: {
            type: String,
            required: true,
        },

        // The images associated with the artwork
        images: {
            type: [Image],
            // TODO: Move to this.
            //type: [{type: String, ref: "Image"}],
            required: true,
        },

        // The images associated with the artwork
        imageRefs: {
            type: [{type: String, ref: "Image"}],
            required: true,
        },

        // The title of the artwork.
        title: {
            type: String,
            es_indexed: true,
        },

        // A list of artist names extracted from the page.
        artists: [Name],

        // The size of the artwork (e.g. 100mm x 200mm)
        dimensions: [Dimension],

        // Date ranges when the artwork was created or modified.
        dates: [YearRange],

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
        },

        // The medium of the artwork (e.g. "watercolor")
        medium: {
            type: String,
            es_indexed: true,
        },

        // Locations where the artwork is stored
        locations: [Location],

        // Categories classifying the artwork
        categories: {
            type: [String],
            es_indexed: true,
        },

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

            // TODO(jeresig): Remove after move to images
            imageNames: {
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
        })
        .set(function(date) {
            if (this.dates[0]) {
                this.dates[0].remove();
            }
            if (date && typeof date !== "string") {
                this.dates.push(date);
            }
        });

    Artwork.virtual("dimension")
        .get(function() {
            return this.dimensions[0];
        })
        .set(function(dimension) {
            if (this.dimensions[0]) {
                this.dimensions[0].remove();
            }
            if (dimension && typeof dimension !== "string") {
                this.dimensions.push(dimension);
            }
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

            if (this.artist && this.artist.artist) {
                parts.push(`${this.artist.artist.getFullName(locale)}:`);
            }

            if (this.title && /\S/.test(this.title)) {
                parts.push(this.title);
            }

            if (this.source) {
                parts.push("-", this.getSource().getFullName(locale));
            }

            return parts.join(" ");
        },

        getSource() {
            return core.models.Source.getSource(this.source);
        },

        addImage(image) {
            // Stop if the image is already in the images list
            if (this.images.indexOf(image._id) >= 0) {
                return;
            }

            this.images.push(image);
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

    Artwork.statics = {
        fromData(data, callback) {
            // Keep track of important statistics
            const warnings = [];

            core.models.Artwork.findById(data._id, (err, artwork) => {
                if (err) {
                    return callback(new Error(
                        "Error locating existing artwork."));
                }

                const creating = !artwork;

                Object.keys(data).forEach((key) => {
                    const schemaPath = Artwork.path(key);

                    if (!schemaPath) {
                        warnings.push(`Unknown column: ${key}`);
                        return;
                    }

                    if (Array.isArray(schemaPath.options.type) &&
                            data[key] && !Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                });

                async.mapLimit(data.images || [], 2, (fileName, callback) => {
                    const _id = `${data.source}/${fileName}`;

                    Image.findById(_id, (err, image) => {
                        if (err) {
                            return callback(err);
                        }

                        if (!image) {
                            warnings.push(`Image file not found: ${fileName}`);
                        }

                        callback(null, _id);
                    });
                }, (err, images) => {
                    if (err) {
                        return callback(new Error(
                            "Error accessing image data."));
                    }

                    // Filter out any missing images
                    images = images.filter((image) => !!image);

                    // We handle the setting of images separately
                    delete data.images;

                    if (images.length === 0) {
                        return callback(new Error("No images found."));
                    }

                    if (creating) {
                        artwork = new core.models.Artwork(data);
                    } else {
                        artwork.set(data);
                    }

                    artwork.validate((err) => {
                        if (err) {
                            // TODO: Convert validation error into something
                            // useful.
                            return callback(err);
                        }

                        callback(null, artwork, warnings);
                    });
                });
            });
        },
    };

    return Artwork;
};

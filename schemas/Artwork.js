"use strict";

const fs = require("fs");
const path = require("path");

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

        // The images associated with the artwork
        images: {
            type: [Image],
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

        // TODO(jeresig): Remove after move to dates
        dateCreateds: [YearRange],

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

        // TODO(jeresig): Remove this once locations exist
        collections: [Location],

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

    Artwork.virtual("dateCreated")
        .get(function() {
            return this.dateCreateds[0];
        })
        .set(function(date) {
            if (this.dateCreateds[0]) {
                this.dateCreateds[0].remove();
            }
            if (date && typeof date !== "string") {
                this.dateCreateds.push(date);
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

        getOriginalURL(image) {
            image = image || this.images[0];
            return core.urls.genData(
                `/${this.source}/images/${image.imageName}.jpg`);
        },

        getScaledURL(image) {
            image = image || this.images[0];
            return core.urls.genData(
                `/${this.source}/scaled/${image.imageName}.jpg`);
        },

        getThumbURL(image) {
            image = image || this.images[0];
            return core.urls.genData(
                `/${this.source}/thumbs/${image.imageName}.jpg`);
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

        addImage(file, callback) {
            const source = this.getSource();

            source.getImage(file, (err, image) => {
                // Stop if the image is already in the images list
                if (this.images.some((match) => image._id === match._id)) {
                    return callback();
                }

                this.images.push(image);
                callback();
            });
        },

        addImages(images, callback) {
            async.mapLimit(images, 1, (imgFile, callback) => {
                this.addImage(imgFile, (err, id) => {
                    if (err) {
                        return callback(err);
                    }

                    if (id) {
                        return this.indexImage(imgFile, id, callback);
                    }

                    callback();
                });
            }, callback);
        },

        indexImage(file, id, callback) {
            core.similar.idIndexed(id, (err, indexed) => {
                if (err || indexed) {
                    return callback(err);
                }

                core.similar.add(file, id, (err) => {
                    // Ignore small images, we just won't index them
                    if (err && err.type === "IMAGE_SIZE_TOO_SMALL") {
                        return callback();
                    }

                    return callback(err);
                });
            });
        },

        updateImageSimilarity(image, callback) {
            const id = image.imageName;

            core.similar.similar(id, (err, matches) => {
                if (err || !matches) {
                    return callback(err);
                }

                image.similarImages = matches
                    .filter((match) => match.id !== id);

                callback();
            });
        },

        syncSimilarity(callback) {
            const artwork = this;

            async.eachLimit(artwork.images, 1, (image, callback) => {
                artwork.updateImageSimilarity(image, callback);
            }, (err) => {
                if (err) {
                    return callback(err);
                }

                // Calculate artwork matches before saving
                const matches = artwork.images
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

                    artwork.similarArtworks = artworks
                        .filter((similar) => similar._id !== artwork._id)
                        .map((similar) => {
                            const imageScores = similar.images.map(
                                (image) => scores[image.imageName] || 0);

                            return {
                                artwork: similar._id,
                                images: similar.images.map(
                                    (image) => image.imageName),
                                score: imageScores.reduce((a, b) => a + b),
                                source: similar.source,
                            };
                        })
                        .filter((similar) => similar.score > 0)
                        .sort((a, b) => b.score - a.score);

                    callback();
                });
            });
        },
    };

    Artwork.statics = {
        fromData(data, callback) {
            // Keep track of important statistics
            const warnings = [];

            core.models.Artwork.findById(data._id, (err, artwork) => {
                const creating = !artwork;

                if (err) {
                    return callback(err);
                }

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

                const images = (data.images || []).filter((imgFile) => {
                    if (!fs.existsSync(imgFile)) {
                        warnings.push(
                            `Image file not found: ${path.basename(imgFile)}`);
                        return false;
                    }

                    return true;
                });

                // We handle the setting of images separately
                delete data.images;

                if (images.length === 0) {
                    return callback(new Error(`No images found.`));
                }

                if (creating) {
                    artwork = new core.models.Artwork(data);
                } else {
                    artwork.set(data);
                }

                artwork.addImages(images, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    artwork.validate((err) => {
                        callback(err, artwork);
                    });
                });
            });
        },
    };

    return Artwork;
};

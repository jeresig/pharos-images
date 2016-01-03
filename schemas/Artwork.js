"use strict";

const fs = require("fs");
const path = require("path");

const async = require("async");

module.exports = (core) => {
    const Name = require("./Name")(core);
    const YearRange = require("./YearRange")(core);
    const Dimension = require("./Dimension")(core);
    const Collection = require("./Collection")(core);
    const Image = require("./Image")(core);

    const Artwork = new core.db.schema({
        // UUID of the image (Format: SOURCE/IMAGEMD5)
        _id: String,

        // Collection ID
        id: String,

        // The date that this item was created
        created: {type: Date, "default": Date.now},

        // The date that this item was updated
        modified: Date,

        // The source of the image.
        source: {type: String, ref: "Source", es_indexed: true},

        // The language of the page from where the data is being extracted. This
        // will influence how extracted text is handled.
        lang: String,

        // A link to the artwork at its source
        url: {type: String},

        // The title of the artwork.
        title: {type: String, es_indexed: true},

        // A list of artist names extracted from the page.
        artists: [Name],

        // The size of the artwork (e.g. 100mm x 200mm)
        dimensions: [Dimension],

        // Date when the artwork was created (typically a rough year, or range).
        dateCreateds: [YearRange],

        // The English form of the object type (e.g. painting, print)
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

        medium: {type: String, es_indexed: true},

        collections: [Collection],

        categories: [String],

        images: [Image],

        // Computed by looking at the results of similarImages
        similarArtworks: [{
            artwork: {type: String, ref: "Artwork"},
            imageNames: [String],
            score: {type: Number, es_indexed: true},
            source: {type: String, es_indexed: true},
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

        sourceDirBase() {
            return core.urls.genLocalFile(this.source._id || this.source);
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
            const sourceDir = this.sourceDirBase();

            core.images.processImage(file, sourceDir, (err, hash) => {
                if (err) {
                    return callback(err);
                }

                hash = hash.toString();

                // Stop if the image is already in the images list
                if (this.images.some((image) => image.imageName === hash)) {
                    return callback();
                }

                core.images.getSize(file, (err, size) => {
                    if (err) {
                        return callback(err);
                    }

                    this.images.push({
                        imageName: hash,
                        width: size.width,
                        height: size.height,
                    });

                    callback(null, hash);
                });
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

            Artwork.findById(data._id, (err, artwork) => {
                if (err) {
                    return callback(err);
                }

                Object.keys(data).forEach((key) => {
                    const schemaPath = Artwork.schema.path(key);

                    if (!schemaPath) {
                        return callback(new Error(`Unknown key: ${key}`));
                    }

                    if (Array.isArray(schemaPath.options.type) &&
                            data[key] && !Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                });

                const creating = !artwork;
                const images = data.images.filter((imgFile) => {
                    if (!fs.existsSync(imgFile)) {
                        warnings.push({
                            fileName: path.basename(imgFile),
                            artworkID: data._id,
                        });
                        return false;
                    }

                    return true;
                });
                delete data.images;

                if (images.length === 0) {
                    warnings.push({
                        artworkID: data._id,
                    });

                    return callback();
                }

                if (creating) {
                    artwork = new Artwork(data);
                } else {
                    artwork.set(data);
                }

                artwork.validate((err) => {
                    if (err) {
                        return callback(err);
                    }

                    artwork.addImages(images, (err) => {
                        callback(err, artwork);
                    });
                });
            });
        },
    };

    // We generate a list of years in which the artwork exists, in order
    // to improve querying inside Elasticsearch
    const updateYearRanges = function(next) {
        (this.dateCreateds || []).forEach((range) => {
            if (!range.start || !range.end || range.start > range.end) {
                return;
            }

            // NOTE(jeresig): This will get much better once generators
            // are available in Node!
            const years = [];

            for (let year = range.start; year <= range.end; year += 1) {
                years.push(year);
            }

            range.years = years;
        });

        next();
    };

    Artwork.pre("validate", updateYearRanges);

    return Artwork;
};

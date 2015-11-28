"use strict";

const async = require("async");

const pastec = require("pastec")({
    server: process.env.PASTEC_URL,
});

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

        // The title of the print.
        title: {type: String, es_indexed: true},

        // A list of artist names extracted from the page.
        artists: [Name],

        // The size of the print (e.g. 100mm x 200mm)
        dimensions: [Dimension],

        // Date when the print was created (typically a rough year, or range).
        dateCreateds: [YearRange],

        objectType: {type: String, es_indexed: true},
        medium: {type: String, es_indexed: true},

        collections: [Collection],

        categories: [String],

        images: [Image],

        // Computed by looking at the results of similarImages
        similarArtworks: [{
            artwork: {type: String, ref: "Artwork"},
            imageNames: [String],
            score: Number,
            source: String,
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

        sourceURLBase() {
            return process.env.BASE_DATA_URL + this.source;
        },

        sourceDirBase() {
            return process.env.BASE_DATA_DIR + this.source;
        },

        getOriginalURL(image) {
            image = image || this.images[0];
            return `${this.sourceURLBase()}/images/${image.imageName}.jpg`;
        },

        getScaledURL(image) {
            image = image || this.images[0];
            return `${this.sourceURLBase()}/scaled/${image.imageName}.jpg`;
        },

        getThumbURL(image) {
            image = image || this.images[0];
            return `${this.sourceURLBase()}/thumbs/${image.imageName}.jpg`;
        },

        getImagePath(image) {
            image = image || this.images[0];
            return `${this.sourceDirBase()}/images/${image.imageName}.jpg`;
        },

        getScaledPath(image) {
            image = image || this.images[0];
            return `${this.sourceDirBase()}/scaled/${image.imageName}.jpg`;
        },

        getTitle(locale) {
            if (this.display_title) {
                return this.display_title;
            }

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

        addImage(file, id, callback) {
            const sourceDir = this.sourceDirBase();

            core.images.processImage(file, sourceDir, false, (err, hash) => {
                if (err) {
                    return callback(err);
                }

                // Use the source-provided ID if it exists
                const imageID = `${this.source}/${id || hash}`;

                // Stop if the image is already in the images list
                if (this.images.some((image) => image.imageID === imageID)) {
                    return this.indexImage(file, hash, callback);
                }

                core.images.getSize(file, (err, size) => {
                    if (err) {
                        return callback(err);
                    }

                    this.images.push({
                        imageName: hash,
                        imageID: imageID,
                        width: size.width,
                        height: size.height,
                    });

                    this.indexImage(file, hash, callback);
                });
            });
        },

        indexImage(file, id, callback) {
            pastec.idIndexed(id, (err, indexed) => {
                if (err) {
                    return callback(err);
                }

                if (indexed) {
                    return callback();
                }

                pastec.add(file, id, (err) => {
                    // Ignore small images, we just won't index them
                    if (err && err.type === "IMAGE_SIZE_TOO_SMALL") {
                        return callback();
                    }

                    return callback(err);
                });
            });
        },

        syncSimilarity(callback) {
            const artwork = this;

            async.mapLimit(artwork.images, 1, (image, callback) => {
                const id = image.imageName;

                pastec.idIndexed(id, (err, exists) => {
                    if (err || !exists) {
                        return callback(err);
                    }

                    pastec.similar(id, (err, matches) => {
                        if (err) {
                            return callback(err);
                        }

                        matches = matches.filter((match) => match.id !== id);
                        image.similarImages = matches;
                        callback(err, matches);
                    });
                });
            }, (err, results) => {
                if (err) {
                    return callback(err);
                }

                // Calculate artwork matches before saving
                const matches = results.filter((match) => match)
                    .reduce((a, b) => a.concat(b), []);
                const scores = matches.reduce((obj, match) => {
                    obj[match.id] = Math.max(match.score, obj[match.id] || 0);
                    return obj;
                }, {});

                if (matches.length === 0) {
                    callback();

                } else {
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
                }
            });
        },
    };

    return Artwork;
};

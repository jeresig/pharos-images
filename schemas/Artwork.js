"use strict";

const versioner = require("mongoose-version");
const mongoosastic = require("mongoosastic");

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
        similarArtworks: [{type: String, ref: "Artwork"}],
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
            return process.env.BASE_DATA_URL +
                (this.source._id || this.source);
        },

        sourceDirBase() {
            return process.env.BASE_DATA_DIR +
                (this.source._id || this.source);
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

            if (this.source && this.source !== "uploads") {
                parts.push("-", this.source.getFullName(locale));
            }

            return parts.join(" ");
        },

        addImage(imageData, imgFile, sourceDir, callback) {
            core.images.processImage(imgFile, sourceDir, false, (err, hash) => {
                if (err) {
                    return callback(err);
                }

                // Store the name and hash of the image file
                imageData.file = imgFile;
                imageData.hash = hash;

                // Use the source-provided ID if it exists
                const id = imageData.id || hash;
                const imageID = `${imageData.source}/${id}`;

                // Stop if the image is already in the images list
                if (this.images.some((image) => image.imageID === imageID)) {
                    return this.indexImage(imageData, callback);
                }

                core.images.getSize(imgFile, (err, dimensions) => {
                    if (err) {
                        return callback(err);
                    }

                    this.images.push({
                        imageName: imageData.hash,
                        imageID: imageID,
                        width: dimensions.width,
                        height: dimensions.height,
                    });

                    this.indexImage(imageData, callback);
                });
            });
        },

        indexImage(imageData, callback) {
            pastec.idIndexed(imageData.hash, (err, indexed) => {
                if (err) {
                    return callback(err);
                }

                if (indexed) {
                    return callback();
                }

                pastec.add(imageData.file, imageData.hash, (err) => {
                    // Ignore small images, we just won't index them
                    if (err && err.type === "IMAGE_SIZE_TOO_SMALL") {
                        return callback();
                    }

                    return callback(err);
                });
            });
        },
    };

    Artwork.plugin(mongoosastic, core.db.mongoosastic);
    Artwork.plugin(versioner, {
        collection: "artwork_versions",
        suppressVersionIncrement: false,
        strategy: "collection",
        mongoose: core.db.mongoose,
    });

    return Artwork;
};

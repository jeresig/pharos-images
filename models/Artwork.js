var mongoose = require("mongoose");
var versioner = require("mongoose-version");
var mongoosastic = require("mongoosastic");

var pastec = require("pastec")({
    server: process.env.PASTEC_URL
});

module.exports = function(lib) {
    try {
        return mongoose.model("Artwork");
    } catch(e) {}

    var Name = require("./Name")(lib);
    var YearRange = require("./YearRange")(lib);
    var Dimension = require("./Dimension")(lib);
    var Collection = require("./Collection")(lib);
    var Artist = require("./Artist")(lib);
    var Image = require("./Image")(lib);

    var ArtworkSchema = new mongoose.Schema({
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
        similarArtworks: [{type: String, ref: "Artwork"}]
    });

    ArtworkSchema.virtual("dateCreated")
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

    ArtworkSchema.virtual("dimension")
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

    ArtworkSchema.methods = {
        getOriginalURL: function(image) {
            image = image || this.images[0];
            return process.env.BASE_DATA_URL +
                (this.source._id || this.source) +
                "/images/" + image.imageName + ".jpg";
        },

        getScaledURL: function(image) {
            image = image || this.images[0];
            return process.env.BASE_DATA_URL +
                (this.source._id || this.source) +
                "/scaled/" + image.imageName + ".jpg";
        },

        getThumbURL: function(image) {
            image = image || this.images[0];
            return process.env.BASE_DATA_URL +
                (this.source._id || this.source) +
                "/thumbs/" + image.imageName + ".jpg";
        },

        getImagePath: function(image) {
            image = image || this.images[0];
            return process.env.BASE_DATA_DIR +
                (this.source._id || this.source) +
                "/images/" + image.imageName + ".jpg";
        },

        getScaledPath: function(image) {
            image = image || this.images[0];
            return process.env.BASE_DATA_DIR +
                (this.source._id || this.source) +
                "/scaled/" + image.imageName + ".jpg";
        },

        getTitle: function(locale) {
            if (this.display_title) {
                return this.display_title;
            }

            var parts = [];

            if (this.artist) {
                if (this.artist.artist) {
                    parts.push(this.artist.artist.getFullName(locale) + ":");
                }
            }

            if (this.title && /\S/.test(this.title)) {
                parts.push(this.title);
            }

            if (this.source && this.source !== "uploads") {
                parts.push("-", this.source.getFullName(locale));
            }

            return parts.join(" ");
        },

        addImage: function(imageData, imgFile, sourceDir, callback) {
            var model = this;
            var source = imageData.source;

            lib.images.processImage(imgFile, sourceDir, false,
                function(err, hash) {
                    if (err) {
                        return callback(err);
                    }

                    // Use the source-provided ID if it exists
                    var id = imageData.id || hash;
                    var imageID = source + "/" + id;

                    // Stop if the image is already in the images list
                    if (model.images.some(function(image) {
                        return image.imageID === imageID;
                    })) {
                        return callback();
                    }

                    lib.images.getSize(imgFile, function(err, dimensions) {
                        if (err) {
                            return callback(err);
                        }

                        model.images.push({
                            imageName: hash,
                            imageID: imageID,
                            width: dimensions.width,
                            height: dimensions.height
                        });

                        // Save the image to Pastec
                        pastec.add(imgFile, imageName, callback);
                    });
                });
        }
    };

    ArtworkSchema.plugin(mongoosastic, lib.db.mongoosastic);
    ArtworkSchema.plugin(versioner, {
        collection: "artwork_versions",
        suppressVersionIncrement: false,
        strategy: "collection",
        mongoose: mongoose
    });

    return mongoose.model("Artwork", ArtworkSchema);
};
var mongoose = require("mongoose");
var versioner = require("mongoose-version");
var mongoosastic = require("mongoosastic");

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

        // The title of the print.
        title: {type: String, es_indexed: true},

        // A list of artist names extracted from the page.
        artists: {type: [Name], es_indexed: true},

        // The size of the print (e.g. 100mm x 200mm)
        dimensions: {type: [Dimension], es_indexed: true},

        // Date when the print was created (typically a rough year, or range).
        dateCreateds: {type: [YearRange], es_indexed: true},

        objectType: {type: String, es_indexed: true},
        medium: {type: String, es_indexed: true},

        collections: {type: [Collection], es_indexed: true},

        categories: {type: [String], es_indexed: true},

        images: [Image]
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

                        callback();
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
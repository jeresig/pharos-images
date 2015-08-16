var mongoose = require("mongoose");

module.exports = function(lib) {
    try {
        return mongoose.model("ExtractedArtwork");
    } catch(e) {}

    var Name = require("./Name")(lib);
    var YearRange = require("./YearRange")(lib);
    var Dimension = require("./Dimension")(lib);
    var Collection = require("./Collection")(lib);
    var Artist = require("./Artist")(lib);

    var ExtractedArtworkSchema = new mongoose.Schema({
        // UUID of the image (Format: SOURCE/IMAGEMD5)
        _id: String,

        // Collection ID
        id: String,

        // The date that this item was created
        created: {type: Date, "default": Date.now},

        // The date that this item was updated
        modified: Date,

        // The source of the image.
        source: {type: String, ref: "Source"},

        // The language of the page from where the data is being extracted. This
        // will influence how extracted text is handled.
        lang: String,

        // The title of the print.
        title: String,

        // A list of artist names extracted from the page.
        artists: [Name],

        // The size of the print (e.g. 100mm x 200mm)
        dimensions: [Dimension],

        // Date when the print was created (typically a rough year, or range).
        dateCreateds: [YearRange],

        objectType: String,
        medium: String,

        collections: [Collection],

        categories: [String]
        /*
        images: [{
            id: String,
            fileName: String
        }]
        */
    });

    ExtractedArtworkSchema.virtual("dateCreated")
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

    ExtractedArtworkSchema.virtual("dimension")
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

    /*
    ExtractedArtworkSchema.virtual("collection")
        .get(function() {
            return this.collections[0];
        })
        .set(function(collection) {
            if (this.collections[0]) {
                this.collections[0].remove();
            }
            if (collection && typeof collection !== "string") {
                this.collections.push(collection);
            }
        });
    */

    return mongoose.model("ExtractedArtwork", ExtractedArtworkSchema);
};
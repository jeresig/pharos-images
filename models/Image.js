var mongoose = require("mongoose");

module.exports = function(lib) {
    try {
        return mongoose.model("Image");
    } catch(e) {}

    var ImageSchema = new lib.db.schema({
        // UUID of the image (Format: SOURCE/IMAGEMD5)
        _id: String,

        // The print that this image is a part of
        print: {type: ObjectId, ref: "Print"},

        // The original extracted data
        extractedArtwork: {type: String, ref: "ExtractedArtwork"},

        // The date that this item was created
        created: {type: Date, "default": Date.now},

        // The date that this item was updated
        modified: {type: Date, es_indexed: true},

        // The source of the image.
        source: {type: String, ref: "Source", es_indexed: true},

        // The name of the downloaded image file
        // (e.g. SOURCE/images/IMAGENAME.jpg)
        imageName: {type: String, es_indexed: true},

        // A unique ID for the image
        // (e.g. SOURCE/IMAGENAME)
        imageID: {type: String, es_indexed: true},

        // Full URL of the original page from where the image came.
        url: String,

        // Other images relating to the print (could be alternate views or
        // other images in a triptych, etc.
        related: [{type: String, ref: "Image"}],

        // Similar images (as determined by MatchEngine)
        similar: [{
            score: Number,
            target_overlap_percent: Number,
            query_overlap_percent: Number,
            overlay: String,
            image: {type: String, ref: "Image"}
        }]
    }, {
        collection: "images"
    });

    mongoose.model("Image", ImageSchema);
};
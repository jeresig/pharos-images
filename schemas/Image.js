"use strict";

module.exports = (core) => new core.db.schema({
    // UUID of the image (Format: SOURCE/IMAGEMD5)
    _id: String,

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

    // Dimension of the image, in pixels
    width: Number,
    height: Number,

    // Similar images (as determined by Pastec)
    similarImages: [{
        id: String,
        score: Number,
    }],
});

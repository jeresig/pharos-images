"use strict";

module.exports = (core) => new core.db.schema({
    // ID of the image (corresponds to Image.imageName)
    _id: String,

    // The date that the similarity was first retrieved
    created: {type: Date, "default": Date.now},

    // The date that the similarity was updated
    modified: {type: Date, es_indexed: true},

    // The source of the image.
    source: {type: String, ref: "Source"},

    // The artwork the image is in
    artwork: {type: String, ref: "Artwork"},

    // Similar images (as determined by Pastec)
    similarImages: [{
        // ID of the image (corresponds to Image.imageName)
        _id: String,

        // The quality of the match
        score: Number,

        // The artwork that holds the image
        artwork: {type: String, ref: "Artwork"},
    }],
});

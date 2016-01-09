"use strict";

module.exports = (core) => {
    const Image = new core.db.schema({
        // An ID for the image in the form: SOURCE/IMAGENAME
        _id: String,

        // The date that this item was created
        created: {
            type: Date,
            default: Date.now,
        },

        // The date that this item was updated
        modified: {
            type: Date,
        },

        // The source that the image is associated with
        source: {
            type: String,
            required: true,
        },

        // TODO: Migrate away from this.
        imageName: {
            type: String,
            required: true,
        },

        // The name of the file (e.g. `foo.jpg`)
        fileName: {
            type: String,
            required: true,
        },

        // Full URL of where the image came.
        url: String,

        // The hashed contents of the image
        hash: {
            type: String,
            required: true,
        },

        // The width of the image
        width: {
            type: Number,
            required: true,
            min: 1,
        },

        // The height of the image
        height: {
            type: Number,
            required: true,
            min: 1,
        },

        // Similar images (as determined by image similarity)
        similarImages: [{
            // The ID of the visually similar image
            _id: {
                type: String,
                required: true,
            },

            // The similarity score between the images
            score: {
                type: Number,
                required: true,
                min: 1,
            },
        }],
    });

    Image.methods = {
        getOriginalURL() {
            return core.urls.genData(
                `/${this.source}/images/${this.hash}.jpg`);
        },

        getScaledURL() {
            return core.urls.genData(
                `/${this.source}/scaled/${this.hash}.jpg`);
        },

        getThumbURL() {
            return core.urls.genData(
                `/${this.source}/thumbs/${this.hash}.jpg`);
        },
    };

    return Image;
};

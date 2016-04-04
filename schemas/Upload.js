"use strict";

const async = require("async");

module.exports = (core) => {
    const Artwork = require("./Artwork")(core);

    const uploadName = "uploads";

    const Upload = Artwork.extend({
        // Source is always set to "uploads"
        source: {
            type: String,
            default: uploadName,
            required: true,
        },

        // The images associated with the upload
        images: {
            type: [{type: String, ref: "UploadImage"}],
            required: true,
        },
    }, {
        collection: uploadName,
    });

    Upload.methods.getTitle = function(req) {
        return req.gettext("Uploaded Image");
    };

    Upload.methods.getURL = function(locale) {
        return core.urls.gen(locale, `/${this._id}`);
    };

    Upload.methods.getImages = function(callback) {
        async.mapLimit(this.images, 4, (id, callback) => {
            if (typeof id !== "string") {
                return process.nextTick(() => callback(null, id));
            }
            core.models.UploadImage.findById(id, callback);
        }, callback);
    };

    Upload.statics.fromImage = function(image, callback) {
        const _id = image._id.replace(/\.jpg$/, "");
        const id = _id.replace(`${uploadName}/`, "");

        // Check to see if image already exists and redirect
        // if it does.
        core.models.Upload.findById(_id, (err, existing) => {
            /* istanbul ignore if */
            if (err) {
                return callback(err);
            }

            if (existing) {
                return callback(null, existing);
            }

            const upload = new core.models.Upload({
                _id,
                id,
                source: "uploads",
                images: [image._id],
                defaultImageHash: image.hash,
                url: image.getOriginalURL(),
                lang: "en",
            });

            callback(null, upload);
        });
    };

    return Upload;
};

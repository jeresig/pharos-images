"use strict";

module.exports = (core) => {
    const Artwork = require("./Artwork")(core);

    const uploadName = "uploads";

    const Upload = Artwork.extend({
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
        return core.urls.gen(locale, `/${uploadName}/${this._id}`);
    };

    return Upload;
};

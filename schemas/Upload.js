"use strict";

module.exports = (core) => {
    const Artwork = require("./Artwork")(core);

    const Upload = Artwork.extend({}, {
        collection: "uploads",
    });

    Upload.methods.getTitle = function(locale) {
        // TODO: Find way to i18n this.
        return "Uploaded Image";
    };

    Upload.methods.getURL = function(locale) {
        return core.urls.gen(locale, `/uploads/${this._id}`);
    };

    return Upload;
};

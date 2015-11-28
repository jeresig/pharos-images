"use strict";

const path = require("path");
const versioner = require("mongoose-version");

module.exports = (core) => {
    const Artwork = require("./Artwork")(core);

    const Upload = Artwork.extend({}, {
        collection: "uploads",
    });

    Upload.methods = {
        getURL(locale) {
            return core.urls.gen(locale, `/uploads/${this._id}`);
        },
    };

    Upload.statics = {
        getDataDir() {
            return path.resolve(process.env.BASE_DATA_DIR, "uploads");
        },
    };

    Upload.plugin(versioner, {
        collection: "upload_versions",
        suppressVersionIncrement: false,
        strategy: "collection",
        mongoose: core.db.mongoose,
    });

    return Upload;
};

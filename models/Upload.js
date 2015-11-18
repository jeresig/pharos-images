"use strict";

const path = require("path");
const versioner = require("mongoose-version");

module.exports = (lib) => {
    try {
        return mongoose.model("Upload");
    } catch(e) {}

    const Image = require("./Image")(lib);

    const UploadSchema = Image.extend({}, {
        collection: "uploads"
    });

    UploadSchema.methods = {
        getURL(locale) {
            return lib.urls.gen(locale, `/uploads/${this.imageName}`);
        }
    };

    UploadSchema.statics = {
        getDataDir() {
            return path.resolve(process.env.BASE_DATA_DIR, "uploads");
        }
    };

    UploadSchema.plugin(versioner, {
        collection: "upload_versions",
        suppressVersionIncrement: false,
        strategy: "collection",
        mongoose: lib.db.mongoose
    });

    lib.db.model("Upload", UploadSchema);
};
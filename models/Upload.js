var versioner = require("mongoose-version");

module.exports = function(lib) {
    try {
        return mongoose.model("Upload");
    } catch(e) {}

    var Image = require("./Image")(lib);

    var UploadSchema = Image.extend({
        // owner: ObjectId,

    }, {
        collection: "uploads"
    });

    UploadSchema.statics.getDataDir = function() {
        return path.resolve(process.env.BASE_DATA_DIR, "uploads");
    };

    UploadSchema.plugin(versioner, {
        collection: "upload_versions",
        suppressVersionIncrement: false,
        strategy: "collection",
        mongoose: lib.db.mongoose
    });

    lib.db.model("Upload", UploadSchema);
};
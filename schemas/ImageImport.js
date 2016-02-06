"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");

const async = require("async");
const unzip = require("unzip2");

module.exports = (core) => {
    const Image = core.models.Image;
    const Import = require("./Import")(core);
    const ImportResult = require("./ImportResult")(core);

    const states = [
        {
            id: "started",
            name: (req) => req.gettext("Uploaded."),
            advance(batch, callback) {
                batch.processImages(callback);
            },
        },
        {
            id: "process.started",
            name: (req) => req.gettext("Processing..."),
        },
        {
            id: "process.completed",
            name: (req) => req.gettext("Processing Completed."),
            advance(batch, callback) {
                batch.indexSimilarity(callback);
            },
        },
        {
            id: "similarity.index.started",
            name: (req) => req.gettext("Indexing similarity..."),
        },
        {
            id: "similarity.index.completed",
            name: (req) => req.gettext("Similarity indexed."),
            advance(batch, callback) {
                batch.syncSimilarity(callback);
            },
        },
        {
            id: "similarity.sync.started",
            name: (req) => req.gettext("Syncing similarity..."),
        },
        {
            id: "similarity.sync.completed",
            name: (req) => req.gettext("Similarity synced."),
            advance(batch, callback) {
                // NOTE(jeresig): Currently nothing needs to be done to finish
                // up the import, other than moving it to the "completed" state.
                process.nextTick(callback);
            },
        },
        {
            id: "completed",
            name: (req) => req.gettext("Completed."),
        },
    ];

    const ImageImportResult = ImportResult.extend({
        // The name of the file being processed
        fileName: {
            type: String,
            required: true,
        },

        // The image record (optional, if the image file has errors)
        model: {type: String, ref: "Image"},
    });

    const ImageImport = Import.extend({
        // The location of the uploaded zip file
        // (temporary, deleted after processing)
        zipFile: {
            type: String,
            required: true,
        },

        // The name of the original file (e.g. `foo.zip`)
        fileName: {
            type: String,
            required: true,
        },

        // The results of the import
        results: [ImageImportResult],
    });

    Object.assign(ImageImport.methods, {
        getStates() {
            return states;
        },

        processImages(callback) {
            const zipFile = fs.createReadStream(this.zipFile);
            const files = [];
            const extractDir = path.join(os.tmpdir(), (new Date).getTime());

            fs.mkdir(extractDir, () => {
                zipFile
                    .pipe(unzip.Parse())
                    .on("entry", (entry) => {
                        const fileName = path.basename(entry.path);
                        const outFileName = path.join(extractDir, fileName);

                        // Ignore things that aren't files (e.g. directories)
                        // Ignore files that don't end with .jpe?g
                        // Ignore files that start with '.'
                        if (entry.type !== "File" ||
                                !/.+\.jpe?g$/i.test(fileName) ||
                                fileName.indexOf(".") === 0) {
                            return entry.autodrain();
                        }

                        // Don't attempt to add files that already exist
                        if (files.indexOf(fileName) >= 0) {
                            return entry.autodrain();
                        }

                        files.push(fileName);
                        entry.pipe(fs.createWriteStream(outFileName));
                    })
                    .on("error", (err) => {
                        throw err;
                    })
                    .on("close", (err) => {
                        if (err) {
                            return callback(
                                new Error("Error opening zip file."));
                        }

                        if (files.length === 0) {
                            return callback(
                                new Error("Zip file has no images in it."));
                        }

                        // Import all of the files as images
                        async.eachLimit(files, 1, (file, callback) => {
                            this.addResult(file, callback);
                        }, callback);
                    });
            });
        },

        addResult(file, callback) {
            const fileName = path.basename(file);

            Image.fromFile(this, file, (err, image, warnings) => {
                const result = {
                    _id: fileName,
                    state: "started",
                    fileName,
                };

                if (err) {
                    result.error = err.message;

                } else {
                    if (warnings) {
                        result.warnings = warnings;
                    }

                    result.model = image._id;
                }

                // Add the result
                this.results.push(result);

                this.save(callback);
            });
        },

        indexSimilarity(callback) {
            async.eachLimit(this.results, 1, (result, callback) => {
                if (result.model &&
                        result.state === "similarity.index.started") {
                    Image.findById(result.model, (err, image) => {
                        if (err) {
                            return callback(err);
                        }

                        image.indexSimilarity(() => {
                            image.save(callback);
                        });
                    });
                } else {
                    callback();
                }
            }, callback);
        },

        syncSimilarity(callback) {
            async.eachLimit(this.results, 1, (result, callback) => {
                if (result.model &&
                        result.state === "similarity.sync.started") {
                    Image.findById(result.model, (err, image) => {
                        if (err) {
                            return callback(err);
                        }

                        image.updateSimilarity(() => {
                            image.save(callback);
                        });
                    });
                } else {
                    callback();
                }
            }, callback);
        },

        // TODO(jeresig): Sync similarity to the other images that are "linked"
        // to in the similarity results.
    });

    return ImageImport;
};

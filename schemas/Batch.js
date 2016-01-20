"use strict";

const path = require("path");

const async = require("async");

module.exports = (core) => {
    const Image = core.models.Image;
    const Source = core.models.Source;

    const states = [
        {
            id: "started",
            name: (req) => req.gettext("Uploaded."),
            autoAdvance: true,
        },
        {
            id: "process.started",
            name: (req) => req.gettext("Processing..."),
        },
        {
            id: "process.completed",
            name: (req) => req.gettext("Processing Completed."),
            autoAdvance: true,
        },
        {
            id: "similarity.index.started",
            name: (req) => req.gettext("Indexing similarity..."),
        },
        {
            id: "similarity.index.completed",
            name: (req) => req.gettext("Similarity indexed."),
            autoAdvance: true,
        },
        {
            id: "similarity.sync.started",
            name: (req) => req.gettext("Syncing similarity..."),
        },
        {
            id: "similarity.sync.completed",
            name: (req) => req.gettext("Similarity synced."),
            autoAdvance: true,
        },
        {
            id: "completed",
            name: (req) => req.gettext("Completed."),
        },
    ];

    const Batch = new core.db.schema({
        // An ID for the batch
        _id: core.db.schema.Types.ObjectId,

        // The date that this batch was created
        created: {
            type: Date,
            default: Date.now,
        },

        // The date that this batch was updated
        modified: {
            type: Date,
        },

        // The source that the image is associated with
        source: {
            type: String,
            required: true,
        },

        // The name of the original file (e.g. `foo.zip`)
        fileName: {
            type: String,
            required: true,
        },

        // The status of the batch upload
        status: {
            type: String,
            enum: states.map((state) => state.id),
            required: true,
        },

        results: [{
            // The id of the result (equal to the fileName)
            _id: String,

            // The status of the batch upload
            status: {
                type: String,
                enum: states.map((state) => state.id),
                required: true,
            },

            // The name of the file being processed
            fileName: {
                type: String,
                required: true,
            },

            // The image record (optional, if the image file has errors)
            image: {type: String, ref: "Image"},

            // An optional error associated with the file
            error: String,

            // An array of string warnings
            warnings: [String],
        }],
    });

    Batch.methods = {
        getSource() {
            return Source.getSource(this.source);
        },

        processImages(callback) {
            callback();
        },

        indexSimilarity(callback) {
            this.status = "similarity.index.started";
            this.modified = new Date();
            this.save(() => {
                async.eachLimit(this.results, 1, (result, callback) => {
                    if (result.image &&
                            result.status === "similarity.index.started") {
                        result.image.indexSimilarity(() => {
                            result.status = "similarity.index.completed";
                            this.modified = new Date();
                            this.save(callback);
                        });
                    } else {
                        callback();
                    }
                }, () => {
                    this.status = "similarity.index.completed";
                    this.modified = new Date();
                    this.save(callback);
                });
            });
        },

        syncSimilarity(callback) {
            this.status = "similarity.sync.started";
            this.modified = new Date();
            this.save(() => {
                async.eachLimit(this.results, 1, (result, callback) => {
                    if (result.image &&
                            result.status === "similarity.sync.started") {
                        result.image.updateSimilarity(() => {
                            result.image.save(() => {
                                result.status = "similarity.sync.completed";
                                result.modified = new Date();
                                result.save(callback);
                            });
                        });
                    } else {
                        callback();
                    }
                }, () => {
                    this.status = "similarity.sync.completed";
                    this.modified = new Date();
                    this.save(callback);
                });
            });
        },

        addImage(file, callback) {
            const fileName = path.basename(file);

            Image.fromFile(this, file, (err, image, warnings) => {
                const result = {
                    _id: fileName,
                    status: "started",
                    fileName,
                };

                if (err) {
                    result.error = err.message;

                } else {
                    if (warnings) {
                        result.warnings = warnings;
                    }

                    result.image = image._id;
                }

                // Add the result
                this.results.push(result);

                this.save(callback);
            });
        },
    };

    Batch.statics = {
        fromUpload(source, file, fileName, callback) {
            const batch = new core.models.Batch({
                source,
                fileName,
                status: "started",
            });

            batch.save((err) => {
                if (err) {
                    return callback(new Error("Error saving uploaded file."));
                }
            });
        },
    };

    return Batch;
};

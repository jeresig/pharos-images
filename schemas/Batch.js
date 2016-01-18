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

        // The images associated with the batch upload
        images: {
            type: [{type: String, ref: "Image"}],
            required: true,
        },

        // Errors
        errors: [{
            fileName: {
                type: String,
                required: true,
            },

            error: {
                type: String,
                required: true,
            },
        }],

        // Warnings
        warnings: [{
            fileName: {
                type: String,
                required: true,
            },

            // An array of string warnings
            warnings: [{
                type: String,
                required: true,
            }],
        }],
    });

    Batch.methods = {
        getSource() {
            return Source.getSource(this.source);
        },

        updateSimilarity(callback) {
            async.eachLimit(this.images, 1, (image, callback) => {
                this.updateSimilarity(callback);
            }, callback);
        },

        indexSimilarity(callback) {
            async.eachLimit(this.images, 1, (image, callback) => {
                this.indexSimilarity(callback);
            }, callback);
        },

        addImage(file, callback) {
            const fileName = path.basename(file);

            Image.fromFile(this, file, (err, image, warnings) => {
                if (err) {
                    this.errors.push({
                        fileName,
                        error: err.message,
                    });

                } else {
                    if (warnings) {
                        this.warnings.push({
                            fileName,
                            warnings,
                        });
                    }

                    this.images.push(image._id);
                }

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

            batch.save(callback);
        },
    };

    return Batch;
};

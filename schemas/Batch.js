"use strict";

const os = require("os");
const fs = require("fs");
const path = require("path");

const async = require("async");
const unzip = require("unzip2");

module.exports = (core) => {
    const Image = core.models.Image;
    const Source = core.models.Source;

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
                batch.finishUp(callback);
            },
        },
        {
            id: "completed",
            name: (req) => req.gettext("Completed."),
        },
    ];

    const possibleStates = states.map((state) => state.id).concat("error");

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

        // The state of the batch upload
        state: {
            type: String,
            enum: possibleStates,
            required: true,
        },

        // An error message, if the state is set to "error"
        error: "String",

        results: [{
            // The id of the result (equal to the fileName)
            _id: String,

            // The state of the batch upload
            state: {
                type: String,
                enum: possibleStates,
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

                    result.image = image._id;
                }

                // Add the result
                this.results.push(result);

                this.save(callback);
            });
        },

        indexSimilarity(callback) {
            async.eachLimit(this.results, 1, (result, callback) => {
                if (result.image &&
                        result.state === "similarity.index.started") {
                    result.image.indexSimilarity(() => {
                        result.image.save(callback);
                    });
                } else {
                    callback();
                }
            }, callback);
        },

        syncSimilarity(callback) {
            async.eachLimit(this.results, 1, (result, callback) => {
                if (result.image &&
                        result.state === "similarity.sync.started") {
                    result.image.updateSimilarity(() => {
                        result.image.save(callback);
                    });
                } else {
                    callback();
                }
            }, callback);
        },

        finishUp(callback) {
            // NOTE(jeresig): Currently nothing needs to be done to finish up
            // the batch, other than moving it to the "completed" state.
            process.nextTick(callback);
        },

        saveState(state, callback) {
            this.state = state;
            this.modified = new Date();
            this.save(callback);
        },

        getCurState() {
            return states[states.find((state) => state.id === this.state)];
        },

        getNextState() {
            return states[states.indexOf(this.getCurState()) + 1];
        },

        canAdvance() {
            return !!this.getCurState().advance;
        },

        advance(callback) {
            const state = this.getCurState();
            const nextState = this.getNextState();

            if (!this.canAdvance()) {
                return process.nextTick(callback);
            }

            this.populate("results.images", () => {
                this.saveState(state.id, () => {
                    state.advance(this, (err) => {
                        // If there was an error then we save the error message
                        // and set the state of the batch to "error" to avoid
                        // retries.
                        if (err) {
                            this.error = err.message;
                            return this.saveState("error", callback);
                        }

                        // Advance to the next state
                        this.saveState(nextState.id, callback);
                    });
                });
            });
        },
    };

    Batch.statics = {
        fromUpload(source, file, fileName, callback) {
            let errored = false;
            const zipFile = path.join(os.tmpdir(),
                `${(new Date).getTime()}.zip`);

            file
                .pipe(fs.createWriteStream(zipFile))
                .on("error", () => {
                    errored = true;
                    callback(new Error("Error saving uploaded file."));
                })
                .on("close", () => {
                    if (errored) {
                        return;
                    }

                    const batch = new core.models.Batch({
                        source,
                        zipFile,
                        fileName,
                        state: "started",
                    });

                    batch.save((err) => {
                        if (err) {
                            return callback(
                                new Error("Error saving uploaded file."));
                        }

                        callback();
                    });
                });
        },

        advance(callback) {
            core.models.Batch
                .find({
                    state: {
                        $nin: ["completed", "error"],
                    },
                }, (err, batches) => {
                    const queues = {};

                    batches
                        .filter((batch) => batch.canAdvance())
                        .forEach((batch) => {
                            if (!queues[batch.state]) {
                                queues[batch.state] = [];
                            }

                            queues[batch.state].push(batch);
                        });

                    // Run all the queues in parallel
                    async.each(Object.keys(queues), (queueName, callback) => {
                        const queue = queues[queueName];

                        // But do each queue in series
                        async.eachLimit(queue, 1, (batch, callback) => {
                            console.log(`Advancing ${batch._id} to ` +
                                `${batch.getNextState()}...`);
                            batch.advance(callback);
                        }, callback);
                    }, callback);
                });
        },

        startAdvancing() {
            const advance = () => this.advance(() =>
                setTimeout(advance, 10000));

            advance();
        },
    };

    return Batch;
};

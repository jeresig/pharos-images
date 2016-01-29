"use strict";

const async = require("async");

// How often uploads should be advanced
const ADVANCE_RATE = 10000;

module.exports = (core) => {
    const Source = core.models.Source;
    const Artwork = core.models.Artwork;

    const states = [
        {
            id: "started",
            name: (req) => req.gettext("Uploaded."),
            advance(batch, callback) {
                //batch.processArtworks(callback);
            },
        },
        {
            id: "process.started",
            name: (req) => req.gettext("Processing..."),
        },
        {
            id: "process.completed",
            name: (req) => req.gettext("Processing Completed."),
            // NOTE(jeresig): Do not auto-advance to importing the data
            // we want the user to make the call on the results.
        },
        {
            id: "import.started",
            name: (req) => req.gettext("Importing data..."),
        },
        {
            id: "import.completed",
            name: (req) => req.gettext("Data imported."),
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

    const Data = new core.db.schema({
        // An ID for the data upload
        _id: core.db.schema.Types.ObjectId,

        // The date that this data upload was created
        created: {
            type: Date,
            default: Date.now,
        },

        // The date that this data upload was updated
        modified: {
            type: Date,
        },

        // The source that the upload is associated with
        source: {
            type: String,
            required: true,
        },

        // The name of the original file (e.g. `foo.json`)
        fileName: {
            type: String,
            required: true,
        },

        // The state of the data upload
        state: {
            type: String,
            enum: possibleStates,
            required: true,
        },

        // An error message, if the state is set to "error"
        error: "String",

        results: [{
            // The id of the result (equal to the record id)
            _id: String,

            // The state of the data record
            state: {
                type: String,
                enum: possibleStates,
                required: true,
            },

            // The data record
            data: {
                type: Object,
                required: true,
            },

            // How the record is being changed
            result: {
                type: String,
                enum: ["created", "changed", "deleted", "error"],
                required: true,
            },

            // The artwork which was affected by this data (optional, empty
            // if the record has errors)
            artwork: {type: String, ref: "Artwork"},

            // A diff of what data changed (optional, only if the record
            // has no errors and previously existed)
            diff: {type: Object},

            // An optional error associated with the file
            error: String,

            // An array of string warnings
            warnings: [String],
        }],
    });

    Data.methods = {
        processArtworks(callback) {
            const incomingIDs = {};

            async.eachLimit(this.results, 1, (result, callback) => {
                Artwork.fromData(result.data, (err, artwork, warnings) => {
                    if (err) {
                        result.result = "error";
                        result.error = err.message;
                        return callback();
                    }

                    if (artwork.isNew) {
                        result.result = "created";

                    } else {
                        result.result = "changed";
                        result.diff = artwork._diff;
                        incomingIDs[artwork._id] = true;
                        result.artwork = artwork._id;
                    }

                    result.warnings = warnings || [];
                    callback();
                });
            }, () => {
                // Find artworks that need to be deleted
                Artwork.find({source: this.source})
                    .lean().distinct("_id")
                    .exec((err, ids) => {
                        ids.forEach((id) => {
                            if (id in incomingIDs) {
                                return;
                            }

                            this.results.push({
                                _id: id,
                                artwork: id,
                                result: "deleted",
                                state: "process.completed",
                            });
                        });

                        callback();
                    });
            });
        },

        importArtworks() {},

        getSource() {
            return Source.getSource(this.source);
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

            this.populate("results.artwork", () => {
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

        getFilteredResults() {
            return {
                images: this.results.filter((result) => result.image),
                errors: this.results.filter((result) => result.error),
                warnings: this.results
                    .filter((result) => result.warnings.length !== 0),
            };
        },
    };

    Data.statics = {
        advance(callback) {
            core.models.Data
                .find({
                    state: {
                        $nin: ["completed", "error"],
                    },
                }, (err, batches) => {
                    if (err || !batches) {
                        return callback(err);
                    }

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
                setTimeout(advance, ADVANCE_RATE));

            advance();
        },
    };

    return Data;
};

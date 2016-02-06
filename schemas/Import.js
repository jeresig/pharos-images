"use strict";

const async = require("async");

// How often batches should be advanced
const ADVANCE_RATE = 5000;

module.exports = (core) => {
    const Source = core.models.Source;
    const ImportResult = require("./ImportResult")(core);

    const Import = new core.db.schema({
        // An ID for the import, based on the source and time
        _id: String,

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

        // The state of the batch upload
        state: {
            type: String,
            required: true,
        },

        // An error message, if the state is set to "error"
        error: "String",

        // The results of the import
        results: [ImportResult],
    });

    Import.methods = {
        getSource() {
            return Source.getSource(this.source);
        },

        saveState(state, callback) {
            this.state = state;
            this.save(callback);
        },

        getCurState() {
            return this.getStates().find((state) => state.id === this.state);
        },

        getNextState() {
            const states = this.getStates();
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

            this.saveState(nextState.id, (err) => {
                state.advance(this, (err) => {
                    // If there was an error then we save the error message
                    // and set the state of the batch to "error" to avoid
                    // retries.
                    if (err) {
                        this.error = err.message;
                        return this.saveState("error", callback);
                    }

                    // Advance to the next state
                    const nextState = this.getNextState();
                    this.saveState(nextState.id, callback);
                });
            });
        },

        getFilteredResults() {
            return {
                models: this.results.filter((result) => result.model),
                errors: this.results.filter((result) => result.error),
                warnings: this.results
                    .filter((result) => (result.warnings || []).length !== 0),
            };
        },
    };

    Import.statics = {
        advance(callback) {
            this.find({
                state: {
                    $nin: ["completed", "error"],
                },
            }).select("_id state").exec((err, batches) => {
                if (err || !batches || batches.length === 0) {
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
                        // We now load the complete batch with all fields intact
                        this.findById(batch._id, (err, batch) => {
                            console.log(`Advancing ${batch._id} to ` +
                                `${batch.getNextState().id}...`);
                            batch.advance(callback);
                        });
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

    Import.pre("save", function(next) {
        // Always updated the modified time on every save
        this.modified = new Date();

        // Create the ID if one hasn't been set before
        if (!this._id) {
            this._id = `${this.source}/${Date.now()}`;
        }

        next();
    });

    return Import;
};

"use strict";

const async = require("async");

module.exports = (core) => {
    const Import = require("./Import")(core);

    const states = [
        {
            id: "started",
            name: (req) => req.gettext("Uploaded."),
            advance(batch, callback) {
                batch.processArtworks(callback);
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
            // batch.importArtworks(callback);
        },
        {
            id: "import.started",
            name: (req) => req.gettext("Importing data..."),
        },
        {
            id: "import.completed",
            name: (req) => req.gettext("Data imported."),
            advance(batch, callback) {
                batch.updateSimilarity();
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

    const errors = {
        ABANDONED: (req) => req.gettext("Data import abandoned."),
        ERROR_READING_DATA: (req) => req.gettext("Error reading data from " +
            "provided data files."),
    };

    // TODO(jeresig): Remove this.
    const req = {
        format: (msg, fields) =>
            msg.replace(/%\((.*?)\)s/g, (all, name) => fields[name]),
        gettext: (msg) => msg,
        lang: "en",
    };

    const ArtworkImport = Import.extend({
        // The name of the original file (e.g. `foo.json`)
        fileName: {
            type: String,
            required: true,
        },
    });

    Object.assign(ArtworkImport.methods, {
        url(req) {
            return core.urls.gen(req.lang,
                `/source/${this.source}/import?artworks=${this._id}`);
        },

        getStates() {
            return states;
        },

        setResults(inputStreams, callback) {
            const source = this.getSource();

            source.processFiles(inputStreams, (err, results) => {
                if (err) {
                    this.error = err.message;
                    return this.saveState("error", callback);
                }

                this.results = results.map((data) => ({
                    data,
                    result: "unknown",
                }));

                callback();
            });
        },

        processArtworks(callback) {
            const Artwork = core.models.Artwork;
            const incomingIDs = {};

            async.eachLimit(this.results, 1, (result, callback) => {
                const data = Object.assign(result.data, {source: this.source});

                Artwork.fromData(data, req, (err, artwork, warnings, isNew) => {
                    if (err) {
                        result.result = "error";
                        result.error = err.message;
                        return callback();
                    }

                    if (isNew) {
                        result.result = "created";

                    } else {
                        result.diff = artwork.diff;
                        incomingIDs[artwork._id] = true;
                        result.model = artwork._id;
                        result.result = result.diff ? "changed" : "unchanged";
                    }

                    result.warnings = warnings;
                    callback();
                });
            }, () => {
                // Find artworks that need to be deleted
                Artwork.find({source: this.source})
                    .lean().distinct("_id")
                    .exec((err, ids) => {
                        for (const id of ids) {
                            if (id in incomingIDs) {
                                continue;
                            }

                            this.results.push({
                                _id: id,
                                model: id,
                                result: "deleted",
                                state: "process.completed",
                                data: {},
                            });
                        }

                        callback();
                    });
            });
        },

        importArtworks(callback) {
            const Artwork = core.models.Artwork;

            async.eachLimit(this.results, 1, (result, callback) => {
                if (result.result === "created") {
                    Artwork.fromData(result.data, (err, artwork) => {
                        artwork.save(callback);
                    });
                } else if (result.result === "changed") {
                    Artwork.findByIdAndUpdate(result.model, result.data,
                        callback);
                } else if (result.result === "deleted") {
                    Artwork.findByIdAndRemove(result.model, callback);
                } else {
                    process.nextTick(callback);
                }
            }, callback);
        },

        updateSimilarity(callback) {
            // Update the similarity on all artworks, including the ones that
            // were just added.
            core.models.Artwork.find({}, {}, {timeout: true}).stream()
                .on("data", function(artwork) {
                    this.pause();
                    artwork.updateSimilarity(() => this.resume());
                })
                .on("close", callback);
        },

        abandon(callback) {
            this.error = "ABANDONED";
            this.saveState("error", callback);
        },

        getFilteredResults() {
            return {
                created: this.results.filter(
                    (result) => result.result === "created"),
                changed: this.results.filter(
                    (result) => result.result === "changed"),
                deleted: this.results.filter(
                    (result) => result.result === "deleted"),
                errors: this.results.filter((result) => result.error),
                warnings: this.results
                    .filter((result) => (result.warnings || []).length !== 0),
            };
        },
    });

    Object.assign(ArtworkImport.statics, {
        getError(err, req) {
            const msg = errors[err];
            return msg ? msg(req) : err;
        },
    });

    return ArtworkImport;
};

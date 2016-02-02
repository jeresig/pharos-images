"use strict";

const async = require("async");

module.exports = (core) => {
    const Artwork = core.models.Artwork;
    const Import = require("./Import")(core);
    const ImportResult = require("./ImportResult")(core);

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

    const ArtworkImportResult = ImportResult.extend({
        // The data record
        data: {
            type: Object,
            required: true,
        },

        // How the record is being changed
        result: {
            type: String,
            enum: ["created", "changed", "deleted", "error", "unknown"],
            required: true,
        },

        // The artwork which was affected by this data (optional, empty
        // if the record has errors)
        model: {type: String, ref: "Artwork"},

        // A diff of what data changed (optional, only if the record
        // has no errors and previously existed)
        diff: {type: Object},
    });

    const ArtworkImport = Import.extend({
        // The name of the original file (e.g. `foo.json`)
        fileName: {
            type: String,
            required: true,
        },

        // The results of the import
        results: [ArtworkImportResult],
    });

    ArtworkImport.methods = {
        getStates() {
            return states;
        },

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
                        result.model = artwork._id;
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

        importArtworks(callback) {
            async.eachLimit(this.results, 1, (result, callback) => {
                if (result.result === "created") {
                    Artwork.fromData(result.data, (err, artwork) => {
                        artwork.save(callback);
                    });
                } else if (result.result === "changed") {
                    result.model.set(result.data).save(callback);
                } else if (result.result === "deleted") {
                    result.model.remove(callback);
                } else {
                    process.nextTick(callback);
                }
            }, callback);
        },

        abandon(callback) {
            this.error = "Data import abandoned.";
            this.saveState("error", callback);
        },
    };

    return ArtworkImport;
};

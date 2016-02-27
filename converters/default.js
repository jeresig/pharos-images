"use strict";
const JSONStream = require("JSONStream");

module.exports = {
    files: [
        "Upload a JSON file (.json) containing artwork metadata.",
    ],

    processFiles(files, callback) {
        const results = [];

        files[0]
            .pipe(JSONStream.parse("*"))
            .on("data", (data) => {
                results.push(data);
            })
            .on("error", function(err) {
                this.destroy();
                // TODO(jeresig): Transmit more friendly error message back
                callback(err);
            })
            .on("end", () => {
                callback(null, results);
            });
    },
};

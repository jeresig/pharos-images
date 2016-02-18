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
            .on("error", (err) => {
                this.destroy();
                // TODO(jeresig): Transmit useful error message back
                console.error(err);
                callback(new Error("Error reading data from the file."));
            })
            .on("end", () => {
                callback(null, results);
            });
    },
};

"use strict";

const path = require("path");

let optionsFile = process.argv[2];

if (optionsFile) {
    optionsFile = path.resolve(process.cwd(), optionsFile);
}

if (!optionsFile && process.env.NODE_ENV === "test") {
    optionsFile = "../tests/options";
}

if (!optionsFile) {
    throw new Error("No options file specified.");
}

module.exports = require(optionsFile);

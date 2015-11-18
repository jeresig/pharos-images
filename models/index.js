"use strict";

const fs = require("fs");
const path = require("path");

const lib = {};

// Load Libraries
fs.readdirSync(path.resolve(__dirname, "../lib")).forEach((file) => {
    if (file.endsWith(".js")) {
        const name = path.basename(file, ".js");
        lib[name] = require(path.resolve(__dirname, "../lib/", file))(lib);
    }
});

lib.models = {};

// Load Models
fs.readdirSync(__dirname).forEach((file) => {
    if (file.endsWith(".js") && file !== "index.js") {
        const name = path.basename(file, ".js");
        lib.models[name] = require("./" + file)(lib);
    }
});

lib.init = function(callback) {
    lib.db.connect(callback);
};

module.exports = lib;
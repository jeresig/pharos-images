"use strict";

// Load in configuration options
require("dotenv").load();

const fs = require("fs");
const path = require("path");

const lib = {};

// Load Libraries
fs.readdirSync("lib").forEach((file) => {
    if (file.endsWith(".js")) {
        const name = path.basename(file, ".js");
        lib[name] = require(path.resolve(__dirname, "./lib/", file))(lib);
    }
});

lib.models = {};

// Load Models
fs.readdirSync("schemas").forEach((file) => {
    if (file.endsWith(".js")) {
        const name = path.basename(file, ".js");
        lib.models[name] = lib.db.model(name,
            require("./schemas/" + file)(lib));
    }
});

lib.init = (callback) => {
    lib.db.connect(callback);
};

module.exports = lib;
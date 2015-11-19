"use strict";

// Load in configuration options
require("dotenv").load();

const fs = require("fs");
const path = require("path");

const core = {};

// Load Libraries
fs.readdirSync("lib").forEach((file) => {
    if (file.endsWith(".js")) {
        const name = path.basename(file, ".js");
        core[name] = require(path.resolve(__dirname, "./lib/", file))(core);
    }
});

core.models = {};

// Load Models
fs.readdirSync("schemas").forEach((file) => {
    if (file.endsWith(".js")) {
        const name = path.basename(file, ".js");
        core.models[name] = core.db.model(name,
            require(`./schemas/${file}`)(core));
    }
});

core.init = (callback) => {
    core.db.connect(callback);
};

module.exports = core;

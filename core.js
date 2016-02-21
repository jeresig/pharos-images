"use strict";

const fs = require("fs");
const path = require("path");
const async = require("async");

// Load in configuration options
require("dotenv").load();

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
        const schema = require(`./schemas/${file}`)(core);

        if (core.db.bindPlugins[name]) {
            core.db.bindPlugins[name](schema);
        }

        core.models[name] = core.db.model(name, schema);
    }
});

core.init = (callback) => {
    return new Promise((resolve, reject) => {
        async.series([
            (callback) => core.db.connect(callback),
            (callback) => core.models.Source.cacheSources(callback),
        ], (err) => {
            if (callback) {
                callback(err);
            }

            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

module.exports = core;

var fs = require("fs");
var path = require("path");

var async = require("async");

// Load in configuration options
require("dotenv").load();

var lib = {};

// Load Libraries
fs.readdirSync(path.resolve(__dirname, "../lib")).forEach(function(file) {
    if (~file.indexOf(".js")) {
        var name = file.replace(/\.js$/, "");
        lib[name] = require(path.resolve(__dirname, "../lib/", file))(lib);
    }
});

lib.models = {};

// Load Models
fs.readdirSync(__dirname).forEach(function(file) {
    if (~file.indexOf(".js") && file !== "index.js") {
        var name = file.replace(/\.js$/, "");
        lib.models[name] = require("./" + file)(lib);
    }
});

lib.init = function(callback) {
    async.parallel([
        function(callback) {
            lib.db.connect(callback);
        }
    ], callback);
};

module.exports = lib;
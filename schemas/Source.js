"use strict";

const fs = require("fs");
const path = require("path");

const async = require("async");

const models = require("../lib/models");
const db = require("../lib/db");
const urls = require("../lib/urls");

let sourceCache = [];

const Source = new db.schema({
    _id: String,
    url: String,
    name: String,
    shortName: String,
    converter: String,
});

Source.methods = {
    getURL(locale) {
        return urls.gen(locale, `/source/${this._id}`);
    },

    getAdminURL(locale) {
        return `${this.getURL(locale)}/admin`;
    },

    getDirBase() {
        return urls.genLocalFile(`data/${this._id}`);
    },

    getFullName() {
        return this.name;
    },

    getShortName() {
        return this.shortName;
    },

    getConverter() {
        const converter = this.converter || "default";
        const converterPath = path.resolve(__dirname,
            `../converters/${converter}.js`);

        /* istanbul ignore if */
        if (!fs.existsSync(converterPath)) {
            throw new Error(
                `Error: Converter file not found: ${converterPath}`);
        }

        // Import the converter module
        return require(converterPath);
    },

    getExpectedFiles() {
        return this.getConverter().files;
    },

    processFiles(files, callback) {
        this.getConverter().processFiles(files, callback);
    },

    cacheNumArtworks(callback) {
        models("Artwork").count({source: this._id}, (err, num) => {
            /* istanbul ignore if */
            if (err) {
                return callback(err);
            }

            this.numArtworks = num;
            callback();
        });
    },

    cacheNumImages(callback) {
        models("Image").count({source: this._id}, (err, num) => {
            /* istanbul ignore if */
            if (err) {
                return callback(err);
            }

            this.numImages = num;
            callback();
        });
    },
};

Source.statics = {
    cacheSources(callback) {
        models("Source").find({}, (err, sources) => {
            sourceCache = sources;

            async.eachLimit(sources, 2, (source, callback) => {
                async.parallel([
                    (callback) => source.cacheNumArtworks(callback),
                    (callback) => source.cacheNumImages(callback),
                ], callback);
            }, () => {
                callback(err, sources);
            });
        });
    },

    getSources() {
        return sourceCache;
    },

    getSource(sourceName) {
        const sources = this.getSources();

        for (const source of sources) {
            if (source._id === sourceName) {
                return source;
            }
        }

        throw new Error(`Source not found: ${sourceName}`);
    },
};

module.exports = Source;

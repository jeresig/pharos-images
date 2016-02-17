"use strict";

const fs = require("fs");
const path = require("path");

const async = require("async");

module.exports = (core) => {
    let sourceCache = [];
    const Artwork = core.models.Artwork;

    const Source = new core.db.schema({
        _id: String,
        url: String,
        name: String,
        shortName: String,
        converter: String,
    });

    Source.methods = {
        getURL(locale) {
            return core.urls.gen(locale, `/source/${this._id}`);
        },

        getDirBase() {
            return core.urls.genLocalFile(this._id);
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
            this.getConverter().process(files, callback);
        },

        cacheNumArtworks(callback) {
            Artwork.count({source: this._id}, (err, num) => {
                this.numArtworks = num || 0;
                callback(err);
            });
        },
    };

    Source.statics = {
        cacheSources(callback) {
            core.models.Source.find({}, (err, sources) => {
                sourceCache = sources;

                async.eachLimit(sources, 2, (source, callback) => {
                    source.cacheNumArtworks(callback);
                }, () => {
                    callback(err, sources);
                });
            });
        },

        getSources() {
            return sourceCache;
        },

        getSource(sourceName) {
            // Return the object if it's already a Source object
            if (sourceName && sourceName._id) {
                return sourceName;
            }

            const sources = this.getSources();

            for (let i = 0; i < sources.length; i++) {
                const source = sources[i];
                if (source._id === sourceName) {
                    return source;
                }
            }

            throw new Error(`Source not found: ${sourceName}`);
        },
    };

    return Source;
};

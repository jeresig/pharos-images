"use strict";

const path = require("path");

const async = require("async");

module.exports = (core) => {
    let sourceCache = [];
    const Artwork = core.models.Artwork;

    const Source = new core.db.schema({
        _id: String,
        url: String,
        name: String,
        nameKanji: String,
        shortName: String,
        shortKanji: String,
        description: String,
        location: String,
        types: [String],
        estNumArtworks: Number,
        inactive: Boolean,
        hideLinks: Boolean,
        linkTitle: String,
        linkText: String,
    });

    Source.methods = {
        getURL(locale) {
            return core.urls.gen(locale, `/source/${this._id}`);
        },

        getDirBase() {
            return core.urls.genLocalFile(this._id);
        },

        getFullName: function(locale) {
            return locale === "ja" && this.nameKanji || this.name;
        },

        getShortName: function(locale) {
            return locale === "ja" && this.shortKanji || this.shortName;
        },

        cacheNumArtworks: function(callback) {
            Artwork.count({source: this._id}, (err, num) => {
                this.numArtworks = num || 0;
                callback(err);
            });
        },

        getImage(file, callback) {
            const fileName = path.basename(file);
            const _id = `${this._id}/${fileName}`;

            core.models.Image.findById(_id, callback);
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

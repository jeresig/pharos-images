"use strict";

module.exports = (core) => {
    let sourceCache = [];

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

        getFullName: function(locale) {
            return locale === "ja" && this.nameKanji || this.name;
        },

        getShortName: function(locale) {
            return locale === "ja" && this.shortKanji || this.shortName;
        },

        getNumArtworks: function() {
            // Artwork.count({source: this._id}, callback);
        },
    };

    Source.statics = {
        cacheSources(callback) {
            core.models.Source.find({}, (err, sources) => {
                sourceCache = sources;
                callback(err, sources);
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

            for (const source of this.getSources()) {
                if (source._id === sourceName) {
                    return source;
                }
            }

            throw new Error(`Source not found: ${sourceName}`);
        },
    };

    return Source;
};

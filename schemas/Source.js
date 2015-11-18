"use strict";

module.exports = (core) => {
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
        linkText: String
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
        }
    };

    return Source;
};
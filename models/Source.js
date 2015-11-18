"use strict";

module.exports = function(lib) {
    try {
        return lib.db.model("Source");
    } catch(e) {}

    const Artwork = lib.db.model("Artwork");

    const SourceSchema = new lib.db.schema({
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

    SourceSchema.methods = {
        getURL(locale) {
            return lib.urls.gen(locale, `/source/${this._id}`);
        },

        getFullName: function(locale) {
            return locale === "ja" && this.nameKanji || this.name;
        },

        getShortName: function(locale) {
            return locale === "ja" && this.shortKanji || this.shortName;
        },

        getNumArtworks: function() {
            Artwork.count({source: this._id}, callback);
        }
    };

    return lib.db.model("Source", SourceSchema);
};
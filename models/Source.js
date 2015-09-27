module.exports = function(lib) {
    try {
        return lib.db.model("Source");
    } catch(e) {}

    var Artwork = lib.db.model("Artwork");

    var SourceSchema = new lib.db.schema({
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
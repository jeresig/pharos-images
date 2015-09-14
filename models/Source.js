module.exports = function(lib) {
    try {
        return lib.db.model("Source");
    } catch(e) {}

    var SourceSchema = new lib.db.schema({
        _id: String,
        url: String,
        name: String,
        nameKanji: String,
        shortName: String,
        shortNanji: String,
        description: String,
        location: String,
        types: [String],
        // NOTE: Is this needed? Generate dynamically?
        numPrints: Number,
        estNumPrints: Number,
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
        }
    };

    return lib.db.model("Source", SourceSchema);
};
var mongoose = require("mongoose");

module.exports = function(lib) {
    try {
        return lib.db.model("Bio");
    } catch(e) {}

    var Name = require("./Name")(lib);
    var YearRange = require("./YearRange")(lib);

    var ObjectId = lib.db.schema.Types.ObjectId;

    var BioSchema = new lib.db.schema({
        // UUID of the image (Format: SOURCE/IMAGEMD5)
        _id: String,

        // The date that this item was created
        created: {type: Date, "default": Date.now},

        // The date that this item was updated
        modified: Date,

        // The source of the artist information.
        source: {type: String, ref: "Source"},

        artist: {type: ObjectId, ref: "Artist"},

        // Similar bios, for easy artist merging (and re-merging)
        similar: [{type: String, ref: "Bio"}],

        extract: [String],
        extracted: {type: Boolean, es_indexed: true},

        // UUID of the source page. (Format: PAGEMD5)
        pageID: String,

        // Full URL of the original page from where the image came.
        url: String,

        // The location of the matching VIAF record for this bio
        viafURL: String,

        // The language of the page from where the data is being extracted.
        // This will influence how extracted text is handled.
        lang: String,

        // The name of the artist
        names: [Name],
        aliases: [Name],

        bio: String,

        actives: [YearRange],
        lives: [YearRange],

        gender: String,

        // Locations in which the artist was active
        locations: [String]
    });

    BioSchema.virtual("name")
        .get(function() {
            return this.names[0];
        })
        .set(function(name) {
            if (this.names[0]) {
                this.names[0].remove();
            }
            this.names.push(name);
        });

    BioSchema.virtual("active")
        .get(function() {
            return this.actives[0];
        })
        .set(function(active) {
            if (this.actives[0]) {
                this.actives[0].remove();
            }
            if (active) {
                this.actives.push(active);
            }
        });

    BioSchema.virtual("life")
        .get(function() {
            return this.lives[0];
        })
        .set(function(life) {
            if (this.lives[0]) {
                this.lives[0].remove();
            }
            if (life) {
                this.lives.push(life);
            }
        });

    mongoose.model("Bio", BioSchema);
};
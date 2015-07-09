var mongoose = require("mongoose");

module.exports = function(lib) {
    try {
        return mongoose.model("Artist");
    } catch(e) {}

    var Name = require("./Name")(lib);
    var YearRange = require("./YearRange")(lib);
    var Bio = require("./Bio")(lib);

    var ArtistSchema = new mongoose.schema({
        // The date that this item was created
        created: {type: Date, "default": Date.now},

        // The date that this item was updated
        modified: Date,

        // The name of the artist
        names: {type: [Name], es_indexed: true},
        aliases: {type: [Name], es_indexed: true},

        bios: [{type: String, ref: "Bio"}],

        // An image that is representative of the artist's work
        repImage: {type: String, ref: "Image"},

        // An image depicting the artist
        artistImage: {type: String, ref: "Image"},

        // Eras in which the artist was active
        eras: [{type: String, ref: "Era"}],

        // The location of the matching VIAF record for this artist
        // or from the Getty Union List of Artist Names
        canonical: [String],

        // Locations in which the artist was active
        locations: {type: [String], es_indexed: true},

        actives: [YearRange],
        lives: [YearRange],

        gender: {type: String, es_indexed: true}
    });

    ArtistSchema.virtual("name")
        .get(function() {
            return this.names[0];
        })
        .set(function(name) {
            if (this.names[0]) {
                this.names[0].remove();
            }
            this.names.push(name);
        });

    ArtistSchema.virtual("active")
        .get(function() {
            return this.actives[0];
        })
        .set(function(active) {
            if (this.actives[0]) {
                this.actives[0].remove();
            }
            this.actives.push(active);
        });

    ArtistSchema.virtual("life")
        .get(function() {
            return this.lives[0];
        })
        .set(function(life) {
            if (this.lives[0]) {
                this.lives[0].remove();
            }
            this.lives.push(life);
        });

    ArtistSchema.virtual("slug")
        .get(function() {
            return (this.name.plain || "artist").toLowerCase()
                .replace(/ /g, "-");
        });

    mongoose.model("Artist", ArtistSchema);
};
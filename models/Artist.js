var mongoose = require("mongoose");

var ArtistSchema = new mongoose.Schema({
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

mongoose.model("Artist", ArtistSchema);
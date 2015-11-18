"use strict";

module.exports = (core) => {
    const Name = require("./Name")(core);
    const YearRange = require("./YearRange")(core);
    const Bio = require("./Bio")(core);

    const Artist = new core.db.schema({
        // The date that this item was created
        created: {type: Date, "default": Date.now},

        // The date that this item was updated
        modified: Date,

        // The name of the artist
        names: {type: [Name], es_indexed: true},
        aliases: {type: [Name], es_indexed: true},

        bios: [Bio],

        // An image that is representative of the artist's work
        repImage: String,

        // An image depicting the artist
        artistImage: String,

        // Eras in which the artist was active
        eras: [{type: String, ref: "Era"}],

        // The location of the matching VIAF record for this artist
        // or from the Getty Union List of Artist Names
        canonical: [String],

        // Locations in which the artist was active
        locations: {type: [String], es_indexed: true},

        actives: [YearRange],
        lives: [YearRange],

        gender: {type: String, es_indexed: true},
    });

    Artist.virtual("name")
        .get(function() {
            return this.names[0];
        })
        .set(function(name) {
            if (this.names[0]) {
                this.names[0].remove();
            }
            this.names.push(name);
        });

    Artist.virtual("active")
        .get(function() {
            return this.actives[0];
        })
        .set(function(active) {
            if (this.actives[0]) {
                this.actives[0].remove();
            }
            this.actives.push(active);
        });

    Artist.virtual("life")
        .get(function() {
            return this.lives[0];
        })
        .set(function(life) {
            if (this.lives[0]) {
                this.lives[0].remove();
            }
            this.lives.push(life);
        });

    Artist.virtual("slug")
        .get(function() {
            return (this.name.plain || "artist").toLowerCase()
                .replace(/ /g, "-");
        });

    Artist.methods = {
        getURL(locale) {
            return core.urls.gen(locale,
                `/artists/${this.slug || "artist"}/${this._id}`);
        },
    };

    return Artist;
};

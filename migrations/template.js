"use strict";

const core = require("../core");
const Artwork = core.models.Artwork;

exports.up = (next) => {
    core.init(() => {
        Artwork.find({}, {}, {timeout: true}).stream()
            .on("data", function(artwork) {
                this.pause();

                console.log(`Migrating ${artwork._id}...`);

                this.resume();
            })
            .on("close", next);
    });
};

exports.down = (next) => {
    next();
};

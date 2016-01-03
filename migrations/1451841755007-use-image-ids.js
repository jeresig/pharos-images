"use strict";

const core = require("../core");
const Artwork = core.models.Artwork;

exports.up = (next) => {
    core.init(() => {
        Artwork.find({}, {}, {timeout: true}).stream()
            .on("data", function(artwork) {
                console.log(`Migrating ${artwork._id}...`);

                artwork.images.forEach((image) => {
                    image._id = image.imageName;
                    image.similarImages.forEach((match) => {
                        match._id = match.id;
                    });
                });

                artwork.similarArtworks.forEach((similar) => {
                    similar._id = similar.artwork;
                    similar.images = similar.imageNames;
                });

                artwork.dates = artwork.dateCreateds;
                artwork.locations = artwork.collections;

                this.pause();
                console.log("saving...");
                artwork.save((err) => {
                    if (err) {
                        console.err(artwork._id, err);
                    }

                    this.resume();
                });
            })
            .on("close", next);
    });
};

exports.down = (next) => {
    next();
};

"use strict";

const core = require("../core");
const Artwork = core.models.Artwork;

exports.up = (next) => {
    core.init(() => {
        Artwork.find({}, {}, {timeout: true}).stream()
            .on("data", function(artwork) {
                this.pause();

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

                artwork.collections.forEach((collection) => {
                    delete collection._id;
                });

                artwork.dates = artwork.dateCreateds;
                artwork.locations = artwork.collections;

                artwork.save((err) => {
                    if (err) {
                        console.error(artwork._id,
                            JSON.stringify(err, null, "    "));
                        return;
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

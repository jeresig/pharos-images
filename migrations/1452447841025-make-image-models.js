"use strict";

const async = require("async");

const core = require("../core");
const Artwork = core.models.Artwork;
const Image = core.models.Image;

exports.up = (next) => {
    core.init(() => {
        Artwork.find({}, {}, {timeout: true}).stream()
            .on("data", function(artwork) {
                this.pause();

                console.log(`Migrating ${artwork._id}...`);

                async.eachLimit(artwork.images, (image, callback) => {
                    const newImage = new Image({
                        _id: `${artwork.source}/${image._id}`,
                        created: new Date(),
                        modified: new Date(),
                        source: artwork.source,
                        //fileName:
                        hash: image._id,
                        width: image.width,
                        height: image.height,
                        similarImages: image.similarImages,
                    });

                    newImage.save(callback);
                }, () => this.resume());
            })
            .on("close", next);
    });
};

exports.down = (next) => {
    next();
};

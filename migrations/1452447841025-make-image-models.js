"use strict";

const fs = require("fs");
const path = require("path");

const async = require("async");

const core = require("../core");
const Artwork = core.models.Artwork;
const Image = core.models.Image;

const mapping = {};

const genHashes = (callback) => {
    const sources = require("../config/data.sources.json");

    async.eachLimit(sources, 1, (source, callback) => {
        const images = fs.readdirSync(source.imageDir);

        console.log(`Processing ${source.name}...`);

        async.eachLimit(images, 2, (image, callback) => {
            const file = path.resolve(source.imageDir, image);

            core.images.hashImage(file, (err, hash) => {
                if (err) {
                    console.error("Error hashing:", file);
                    return callback();
                }

                mapping[hash] = image;
                callback();
            });
        }, callback);
    }, callback);
};

const loadImages = (callback) => {
    Artwork.find({}, {}, {timeout: true}).stream()
        .on("data", function(artwork) {
            this.pause();

            console.log(`Migrating ${artwork._id}...`);

            async.eachLimit(artwork.images, 1, (image, callback) => {
                const fileName = mapping[image._id];
                const _id = `${artwork.source}/${fileName}`;
                const date = artwork.created;

                if (!fileName) {
                    console.error("No file found:", _id);
                    return callback();
                }

                // TODO: Re-map _ids in similarImages
                // TODO: Figure out extra id in similarImages
                // TODO: Generate artwork.imageRefs
                // TODO: Update syncSimilarity to get the true image ID

                const newImage = new Image({
                    _id,
                    created: date,
                    modified: date,
                    source: artwork.source,
                    fileName,
                    hash: image._id,
                    width: image.width,
                    height: image.height,
                    similarImages: image.similarImages,
                });

                newImage.save((err) => {
                    if (err) {
                        console.error("Error saving:", err);
                    }
                    callback();
                });
            }, () => this.resume());
        })
        .on("close", callback);
};

exports.up = (next) => {
    core.init(() => {
        genHashes(() =>
            loadImages(() => next));
    });
};

exports.down = (next) => {
    next();
};

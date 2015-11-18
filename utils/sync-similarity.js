"use strict";

const fs = require("fs");
const path = require("path");

const async = require("async");
const ArgumentParser = require("argparse").ArgumentParser;

const core = require("../core");

const pastec = require("pastec")({
    server: process.env.PASTEC_URL
});

const argparser = new ArgumentParser({
    description: "..."
});

const args = argparser.parseArgs();

core.init(() => {
    // Models
    const Artwork = core.models.Artwork;

    console.log("Finding artwork records...");

    Artwork.find().stream()
        .on("data", function(artwork) {
            this.pause();
            async.mapLimit(artwork.images, 1, (image, callback) => {
                // NOTE(jeresig): Whenever pastec gets support for searching by
                // ID, this should be switched over to using `image.imageName`
                const path = artwork.getScaledPath(image);
                pastec.fileSimilar(path, (err, matches) => {
                    image.similarImages = matches;
                    callback(err, matches);
                });
            }, (err, results) => {
                // Calculate artwork matches before saving
                const matches = [];

                results.forEach(result => {
                    result.forEach(match => {
                        matches.push({"images.imageName": match.id});
                    });
                });

                if (matches.length === 0) {
                    artwork.save(() => this.resume());

                } else {
                    Artwork.find({$or: matches}, (err, artworks) => {
                        if (err) {
                            return callback(err);
                        }

                        artwork.similarArtworks =
                            artworks.map(artwork => artwork._id);
                        artwork.save(() => this.resume());
                    });
                }
            });
        })
        .on("close", () => {
            if (err) {
                console.error(err);
            } else {
                console.log("DONE");
            }
            process.exit(0);
        });
});
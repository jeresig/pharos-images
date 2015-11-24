"use strict";

const async = require("async");

const core = require("../core");

const pastec = require("pastec")({
    server: process.env.PASTEC_URL,
});

core.init(() => {
    // Models
    const Artwork = core.models.Artwork;

    console.log("Finding artwork records...");

    Artwork.find({}, {}, {timeout: true}).stream()
        .on("data", function(artwork) {
            this.pause();

            console.log("Syncing", artwork._id);

            async.mapLimit(artwork.images, 1, (image, callback) => {
                const id = image.imageName;

                pastec.idIndexed(id, (err, exists) => {
                    if (err || !exists) {
                        return callback(err);
                    }

                    pastec.similar(id, (err, matches) => {
                        if (err) {
                            return callback(err);
                        }

                        matches = matches.filter((match) => match.id !== id);
                        image.similarImages = matches;
                        callback(err, matches);
                    });
                });
            }, (err, results) => {
                // Calculate artwork matches before saving
                const matches = results.filter((match) => match)
                    .reduce((a, b) => a.concat(b), []);
                const scores = matches.reduce((obj, match) => {
                    obj[match.id] = Math.max(match.score, obj[match.id] || 0);
                    return obj;
                }, {});

                if (matches.length === 0) {
                    artwork.save(() => this.resume());

                } else {
                    const query = matches.map((match) => ({
                        "images.imageName": match.id,
                    }));

                    Artwork.find({$or: query}, (err, artworks) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        artwork.similarArtworks = artworks
                            .filter((similar) => similar._id !== artwork._id)
                            .map((similar) => {
                                const imageScores = similar.images.map(
                                    (image) => scores[image.imageName] || 0);

                                return {
                                    id: similar._id,
                                    score: Math.max(...imageScores),
                                };
                            });

                        artwork.save(() => this.resume());
                    });
                }
            });
        })
        .on("close", (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log("DONE");
            }
            process.exit(0);
        });
});

var fs = require("fs");
var path = require("path");

var async = require("async");
var ArgumentParser = require("argparse").ArgumentParser;

var core = require("./models");

var pastec = require("pastec")({
    server: process.env.PASTEC_URL
});

var argparser = new ArgumentParser({
    description: "..."
});

var args = argparser.parseArgs();

core.init(function() {
    // Models
    var Artwork = core.models.Artwork;

    console.log("Finding artwork records...");

    Artwork.find().stream()
        .on("data", function(artwork) {
            this.pause();
            async.mapLimit(artwork.images, 1, function(image, callback) {
                // NOTE(jeresig): Whenever pastec gets support for searching by
                // ID, this should be switched over to using `image.imageName`
                var path = artwork.getScaledPath(image);
                pastec.fileSimilar(path, function(err, matches) {
                    image.similarImages = matches;
                    callback(err, matches);
                });
            }, (err, results) => {
                // Calculate artwork matches before saving
                var matches = [];

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
        .on("close", function() {
            if (err) {
                console.error(err);
            } else {
                console.log("DONE");
            }
            process.exit(0);
        });
});
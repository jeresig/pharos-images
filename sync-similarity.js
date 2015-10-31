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
                var path = artwork.getScaledPath(image);
                pastec.fileSimilar(path, function(err, matches) {
                    matches = matches.map(function(match) {
                        // TODO: Convert the match
                        return match;
                    });

                    image.similarImages = matches;

                    callback(err, image);
                });
            }, (err, results) => {
                // TODO: Calculate artwork matches before saving
                artwork.save(() => this.resume());
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
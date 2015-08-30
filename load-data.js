var fs = require("fs");
var path = require("path");

var async = require("async");
var ArgumentParser = require("argparse").ArgumentParser;

var core = require("./models");

var argparser = new ArgumentParser({
    description: "Parse a data file, given the specified converter, and load" +
        "it in to the database for future traversal."
});

argparser.addArgument(["source"], {
    help: "The name of source of the data (e.g. 'frick' or 'fzeri')."
});

var args = argparser.parseArgs();
var sources = require("./data.sources.json");

var importData = function(options, callback) {
    var converterPath = "./converters/" + options.converter + ".js";

    if (!fs.existsSync(converterPath)) {
        return callback("Error: Converter file not found: " + converterPath);
    }

    if (!fs.existsSync(options.dataFile)) {
        return callback("Error: Data file not found: " + options.dataFile);
    }

    if (!fs.existsSync(options.imageDir)) {
        return callback("Error: Directory not found: " + options.imageDir);
    }

    // Import the converter module
    var converter = require(converterPath);

    // Start a stream for the source's data file
    var fileStream = fs.createReadStream(options.dataFile);

    // Models
    var Image = core.models.Image;
    var ExtractedArtwork = core.models.ExtractedArtwork;

    // Keep track of important statistics
    var missingImages = [];
    var emptyArtworks = [];

    converter.process(fileStream, function(data, callback) {
        data._id = options.source + "/" + data.id;
        data.lang = options.lang;
        data.source = options.source;

        async.mapLimit(data.images, 1, function(imageData, callback) {
            imageData.source = options.source;
            imageData.fileName = imageData.fileName.replace(/^.*\//, "");

            var imgFile = path.resolve(options.imageDir, imageData.fileName);
            var sourceDir = path.resolve(process.env.BASE_DATA_DIR,
                options.source);

            if (!fs.existsSync(imgFile)) {
                console.log("Missing Image:", imageData.fileName);

                missingImages.push({
                    fileName: imageData.fileName,
                    artworkID: data._id
                });

                return callback();
            }

            Image.addImage(imageData, imgFile, sourceDir, function(err, imageData) {
                if (err) {
                    return callback(err);
                }

                imageData.extractedArtwork = data._id;

                Image.findById(imageData._id, function(err, image) {
                    if (err) {
                        return callback(err);
                    }

                    if (image) {
                        image.set(imageData);
                    } else {
                        image = new Image(imageData);
                    }

                    callback(err, image);
                });
            });
        }, function(err, images) {
            if (err) {
                return callback(err);
            }

            // Filter out missing images
            images = images.filter(function(image) {
                return !!image;
            });

            if (images.length === 0) {
                console.log("Empty Artwork:", data._id);

                emptyArtworks.push({
                    artworkID: data._id
                });

                return callback();
            }

            data.images = images.map(function(image) {
                return image._id;
            });

            ExtractedArtwork.findById(data._id, function(err, artwork) {
                if (err) {
                    return callback(err);
                }

                if (artwork) {
                    artwork.set(data);
                } else {
                    artwork = new ExtractedArtwork(data);
                }

                console.log("Saving Artwork...", artwork._id);

                artwork.save(function(err) {
                    if (err) {
                        return callback(err);
                    }

                    // Now that we know we can save all the images
                    async.eachLimit(images, 1, function(image, callback) {
                        console.log("Saving Image...", image._id);
                        image.save(callback);
                    }, callback);
                });
            });
        });
    }, callback);
};

core.init(function() {
    var sourceOptions;

    sources.forEach(function(options) {
        if (options.source === args.source) {
            sourceOptions = options;
        }
    });

    if (!sourceOptions) {
        console.error("Source not found in data.config.json.");
        process.exit(0);
    }

    importData(sourceOptions, function(err) {
        if (err) {
            console.error(err);
        } else {
            console.log("DONE");
        }
        process.exit(0);
    });
});
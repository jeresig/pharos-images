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

    options.dataFiles.forEach(function(file) {
        if (!fs.existsSync(file)) {
            return callback("Error: Data file not found: " + file);
        }
    });

    if (!fs.existsSync(options.imageDir)) {
        return callback("Error: Directory not found: " + options.imageDir);
    }

    // Import the converter module
    var converter = require(converterPath);

    // Start a stream for the source's data file
    var fileStreams = options.dataFiles.map(function(file) {
        return fs.createReadStream(file);
    });

    // Models
    var Artwork = core.models.Artwork;

    // Keep track of important statistics
    var missingImages = [];
    var emptyArtworks = [];

    converter.process(fileStreams, function(data, callback) {
        data._id = options.source + "/" + data.id;
        data.lang = options.lang;
        data.source = options.source;

        Artwork.findById(data._id, function(err, artwork) {
            if (err) {
                return callback(err);
            }

            var images = data.images;
            delete data.images;

            if (!Array.isArray(images)) {
                images = [images];
            }

            if (artwork) {
                artwork.set(data);
            } else {
                artwork = new Artwork(data);
            }

            async.mapLimit(images, 2, function(imageData, callback) {
                imageData.source = data.source;
                imageData.fileName = imageData.fileName.replace(/^.*\//, "");

                var imgFile = path.resolve(options.imageDir,
                    imageData.fileName);
                var sourceDir = path.resolve(process.env.BASE_DATA_DIR,
                    options.source);

                if (!imageData.fileName || !fs.existsSync(imgFile)) {
                    console.log("Missing Image:", imageData.fileName);

                    missingImages.push({
                        fileName: imageData.fileName,
                        artworkID: data._id
                    });

                    return callback();
                }

                artwork.addImage(imageData, imgFile, sourceDir, callback);
            }, function(err) {
                if (err) {
                    return callback(err);
                }

                if (artwork.images.length === 0) {
                    console.log("Empty Artwork:", data._id);

                    emptyArtworks.push({
                        artworkID: data._id
                    });

                    return callback();
                }

                console.log("Saving Artwork...", artwork._id);
                artwork.save(function() {
                    // Make sure we wait until the data is fully indexed before
                    // continuing, otherwise we may lose some information!
                    artwork.on("es-indexed", callback);
                });
            });
        });
    }, function(err) {
        callback(err, {
            missingImages: missingImages,
            emptyArtworks: emptyArtworks
        });
    });
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

    // Models
    var Source = core.models.Source;

    console.log("Creating source record...");

    Source.create({
        _id: sourceOptions.source,
        name: sourceOptions.name,
        shortName: sourceOptions.shortName
    }, function() {
        importData(sourceOptions, function(err) {
            if (err) {
                console.error(err);
            } else {
                console.log("DONE");
            }
            process.exit(0);
        });
    });
});
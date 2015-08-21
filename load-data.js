var fs = require("fs");
var path = require("path");

var async = require("async");
var ArgumentParser = require("argparse").ArgumentParser;

var core = require("./models");

var argparser = new ArgumentParser({
    description: "Parse a data file, given the specified converter, and load" +
        "it in to the database for future traversal."
});

argparser.addArgument(["converter"], {
    help: "The name of the converter to use on the data (see: converters/)."
});

argparser.addArgument(["source"], {
    help: "The name of source of the data (e.g. 'frick' or 'fzeri')."
});

argparser.addArgument(["dataFile"], {
    help: "The data file to load in using the converter."
});

argparser.addArgument(["imageDir"], {
    help: "A directory holding the images to import."
});

argparser.addArgument(["--lang"], {
    defaultValue: "en",
    help: "The language the contents of the file are in (default: en)."
});

var args = argparser.parseArgs();

var converterPath = "./converters/" + args.converter;

if (!fs.existsSync(converterPath)) {
    console.error("Error: Converter file not found:", converterPath);
    process.exit(0);
}

if (!fs.existsSync(args.dataFile)) {
    console.error("Error: Data file not found:", args.dataFile);
    process.exit(0);
}

if (!fs.existsSync(args.imageDir)) {
    console.error("Error: Directory not found:", args.imageDir);
    process.exit(0);
}

core.init(function() {
    // Import the converter module
    var converter = require(converterPath);

    // Start a stream for the source's data file
    var fileStream = fs.createReadStream(args.dataFile);

    // Models
    var Image = core.models.Image;
    var ExtractedArtwork = core.models.ExtractedArtwork;

    converter.process(fileStream, function(data, callback) {
        data._id = args.source + "/" + result.id;
        data.lang = args.lang;
        data.source = args.source;

        async.eachLimit(data.images, function(imageData, callback) {
            imageData.source = args.source;
            imageData.fileName = imageData.fileName.replace(/^.*\//, "");

            //path.resolve(imageData.fileName)

            Image.addImage(imageData, sourceDir, function(err, image) {
                if (err) {
                    return callback(err);
                }

                image.extractedArtwork = data._id;
                image.save(function() {
                    data.images.push(image._id);
                    callback();
                });
            });
        }, function() {
            var model = new ExtractedArtwork(data);
            console.log(model);
            model.save(callback);
        });
    }, function() {
        console.log("DONE");
        process.exit(0);
    });
});
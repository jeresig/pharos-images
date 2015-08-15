var fs = require("fs");
var mongoose = require("mongoose");
var ArgumentParser = require("argparse").ArgumentParser;

// Load in configuration options
require("dotenv").load();

require("./models/ExtractedArtwork.js")();

var ExtractedArtwork = mongoose.model("ExtractedArtwork");

var argparser = new ArgumentParser({
    description: "Parse a data file, given the specified converter, and load" +
        "it in to the database for future traversal."
});

argparser.addArgument(["source"], {
    help: "The name of source of the data (e.g. 'frick' or 'fzeri')."
});

argparser.addArgument(["converter"], {
    help: "The name of the converter to use on the data (see: converters/)."
});

argparser.addArgument(["dataFile"], {
    help: "The data file to load in using the converter."
});

argparser.addArgument(["--lang"], {
    defaultValue: "en",
    help: "The language the contents of the file are in (default: en)."
});

var args = argparser.parseArgs();
var converter = require("./converters/" + args.converter);
var fileStream = fs.createReadStream(args.dataFile);

mongoose.connect(process.env.MONGODB_URL);

mongoose.connection.on("error", function(err) {
    console.error("Error Connecting to Database:", err)
});

mongoose.connection.once("open", function() {
    converter.process(fileStream, function(data, callback) {
        data._id = args.source + "/" + result.id;
        data.lang = args.lang;
        data.source = args.source;

        var model = new ExtractedArtwork(data);
        console.log(model);
        model.save(callback);
    }, function() {
        console.log("DONE");
        process.exit(0);
    });
});
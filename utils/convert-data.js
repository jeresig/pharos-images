"use strict";

const fs = require("fs");
const path = require("path");

const ArgumentParser = require("argparse").ArgumentParser;

const core = require("../core");

const argparser = new ArgumentParser({
    description: "Parse a data file, given the specified converter, and" +
        "return a JSON representation to load into the database.",
});

argparser.addArgument(["source"], {
    help: "The name of source of the converter (e.g. 'frick' or 'fzeri').",
});

const args = argparser.parseArgs();
const sources = require("../config/data.sources.json");

core.init(() => {
    const source = core.models.Source.getSource(args.source);
    const options = sources.find((item) => item.source === args.source);

    if (!options) {
        console.error("Source not found in data.config.json.");
        process.exit(0);
    }

    // Import the converter module
    const converter = source.getConverter();

    options.dataFiles = options.dataFiles.map((file) =>
        path.resolve(__dirname, "..", file));

    options.dataFiles.forEach((file) => {
        if (!fs.existsSync(file)) {
            console.error(`Error: Data file not found: ${file}`);
            process.exit(0);
        }
    });

    // Start a stream for the source's data file
    const fileStreams = options.dataFiles.map(
        (file) => fs.createReadStream(file));

    converter.processFiles(fileStreams, (err, results) => {
        if (err) {
            console.error(err);
        } else {
            console.log(JSON.stringify(results));
        }
        process.exit(0);
    });
});

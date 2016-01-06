"use strict";

const fs = require("fs");
const path = require("path");

const ArgumentParser = require("argparse").ArgumentParser;

const core = require("../core");

const argparser = new ArgumentParser({
    description: "Parse a data file, given the specified converter, and load" +
        "it in to the database for future traversal.",
});

argparser.addArgument(["--dry-run"], {
    help: "Perform a dry run on the import.",
    action: "storeTrue",
    dest: "dryRun",
});

argparser.addArgument(["source"], {
    help: "The name of source of the data (e.g. 'frick' or 'fzeri').",
});

const args = argparser.parseArgs();
const sources = require("../config/data.sources.json");

const importData = (options, callback) => {
    const converterPath = path.resolve(__dirname,
        `../converters/${options.converter}.js`);

    if (!fs.existsSync(converterPath)) {
        return callback(`Error: Converter file not found: ${converterPath}`);
    }

    options.dataFiles = options.dataFiles.map((file) =>
        path.resolve(__dirname, "..", file));

    options.dataFiles.forEach((file) => {
        if (!fs.existsSync(file)) {
            return callback(`Error: Data file not found: ${file}`);
        }
    });

    if (!fs.existsSync(options.imageDir)) {
        return callback(`Error: Directory not found: ${options.imageDir}`);
    }

    // Import the converter module
    const converter = require(converterPath);

    // Start a stream for the source's data file
    const fileStreams = options.dataFiles.map(
        (file) => fs.createReadStream(file));

    // Models
    const Artwork = core.models.Artwork;

    converter.process(fileStreams, (data, callback) => {
        data._id = `${options.source}/${data.id}`;
        data.lang = options.lang;
        data.source = options.source;

        data.images = data.images.map((fileName) =>
            path.resolve(options.imageDir, fileName));

        Artwork.fromData(data, (err, artwork) => {
            if (err) {
                console.log("Error with artwork:", err);
                return callback();
            }

            if (args.dryRun) {
                if (artwork._diff) {
                    console.log("Updating", artwork._id,
                        JSON.stringify(artwork._diff, null, "    "));
                    //console.log(JSON.stringify(artwork.toObject({
                    //    transform: true})));
                }
                return callback();
            }

            console.log("Saving Artwork...", artwork._id);

            artwork.save((err) => {
                if (err) {
                    console.error("Error saving:", err);
                }

                // Make sure we wait until the data is fully indexed
                // before continuing, otherwise we may lose some
                // information!
                artwork.on("es-indexed", (err, res) => {
                    if (err) {
                        console.error("Error indexing:", err);
                    }

                    callback(err);
                });
            });
        });
    }, (err) => {
        callback(err);
    });
};

core.init(() => {
    let sourceOptions;

    sources.forEach((options) => {
        if (options.source === args.source) {
            sourceOptions = options;
        }
    });

    if (!sourceOptions) {
        console.error("Source not found in data.config.json.");
        process.exit(0);
    }

    // Models
    const Source = core.models.Source;

    console.log("Creating source record...");

    // Will update an existing record, if it exists, or create a new
    // one if it doesn't.
    Source.update({
        _id: sourceOptions.source,
    }, {
        _id: sourceOptions.source,
        name: sourceOptions.name,
        shortName: sourceOptions.shortName,
        url: sourceOptions.url,
    }, {
        upsert: true,
    }, () => {
        console.log("Importing data...");

        importData(sourceOptions, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log("DONE");
            }
            process.exit(0);
        });
    });
});

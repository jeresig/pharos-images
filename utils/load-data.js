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

    // Keep track of important statistics
    const missingImages = [];
    const emptyArtworks = [];

    converter.process(fileStreams, (data, callback) => {
        data._id = `${options.source}/${data.id}`;
        data.lang = options.lang;
        data.source = options.source;

        Artwork.findById(data._id, (err, artwork) => {
            if (err) {
                return callback(err);
            }

            for (const key in data) {
                const schemaPath = Artwork.schema.path(key);

                if (!schemaPath) {
                    return callback(new Error(`Unknown key: ${key}`));
                }

                if (Array.isArray(schemaPath.options.type) &&
                        data[key] && !Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
            }

            const creating = !artwork;
            const images = data.images.map((image) => {
                const fileName = image.fileName.replace(/^.*[\/]/, "");
                return path.resolve(options.imageDir, fileName);
            }).filter((imgFile) => {
                if (!fs.existsSync(imgFile)) {
                    missingImages.push({
                        fileName: path.basename(imgFile),
                        artworkID: data._id,
                    });
                    return false;
                }

                return true;
            });
            delete data.images;

            if (images.length === 0) {
                emptyArtworks.push({
                    artworkID: data._id,
                });

                return callback();
            }

            if (creating) {
                artwork = new Artwork(data);
            } else {
                artwork.set(data);
            }

            artwork.validate((err) => {
                if (err) {
                    return callback(err);
                }

                artwork.addImages(images, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    if (args.dryRun) {
                        console.log(JSON.stringify(artwork._diff,
                            null, "    "));
                        console.log(JSON.stringify(artwork.toObject({
                            transform: true})));
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
            });
        });
    }, (err) => {
        callback(err, {
            missingImages: missingImages,
            emptyArtworks: emptyArtworks,
        });
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

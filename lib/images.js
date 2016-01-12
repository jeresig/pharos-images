"use strict";

const path = require("path");

const farmhash = require("farmhash");
const imageinfo = require("imageinfo");
const fs = require("graceful-fs");
let gm = require("gm");
const async = require("async");
const request = require("request");

const genTmpFile = () => {
    return `/tmp/${(new Date).getTime()}${Math.random()}`;
};

// Add the ability to provide an explicit bath to the GM binary
if (process.env.GM_PATH) {
    gm = gm.subClass({appPath: process.env.GM_PATH});
}

if (!process.env.THUMB_SIZE) {
    throw new Error("THUMB_SIZE must be specified.");
}

if (!process.env.SCALED_SIZE) {
    throw new Error("SCALED_SIZE must be specified.");
}

module.exports = (core) => {
    return {
        maxAttempts: 3,

        convert(inputStream, outputFile, config, callback) {
            let stream = gm(inputStream).autoOrient();

            if (arguments.length === 4) {
                stream = config(stream);
            } else {
                callback = config;
            }

            stream
                .stream("jpg")
                .on("error", (err) => {
                    callback(new Error(
                        `Error converting file to JPEG: ${err}`));
                })
                .pipe(fs.createWriteStream(outputFile))
                .on("finish", () => {
                    callback(null, outputFile);
                });
        },

        parseSize(size) {
            const parts = size.split("x");

            return {
                width: parseFloat(parts.width),
                height: parseFloat(parts.height),
            };
        },

        getSize(fileName, callback) {
            fs.readFile(fileName, (err, data) => {
                if (err) {
                    return callback(err);
                }

                const info = imageinfo(data);

                callback(null, {
                    width: info.width,
                    height: info.height,
                });
            });
        },

        cropToFile(inputFile, outputFile, coords, callback) {
            gm(inputFile)
                .crop(coords.width, coords.height, coords.x, coords.y)
                .write(outputFile, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
        },

        makeThumb(baseDir, fileName, callback) {
            const imageFile = path.resolve(baseDir, "images", fileName);
            const thumbFile = path.resolve(baseDir, "thumbs", fileName);
            const size = this.parseSize(process.env.THUMB_SIZE);

            this.convert(fs.createReadStream(imageFile), thumbFile, (img) => {
                return img.resize(size.width, size.height, ">")
                    .gravity("Center")
                    .extent(size.width, size.height);
            }, callback);
        },

        makeScaled(baseDir, fileName, callback) {
            const imageFile = path.resolve(baseDir, "images", fileName);
            const scaledFile = path.resolve(baseDir, "scaled", fileName);
            const scaled = this.parseSize(process.env.SCALED_SIZE);

            this.convert(fs.createReadStream(imageFile), scaledFile, (img) => {
                return img.resize(scaled.width, scaled.height, "^>");
            }, callback);
        },

        makeThumbs(fullPath, callback) {
            const baseDir = path.resolve(path.dirname(fullPath), "..");
            const fileName = path.basename(fullPath);

            async.series([
                (callback) => this.makeThumb(baseDir, fileName, callback),
                (callback) => this.makeScaled(baseDir, fileName, callback),
            ], (err) => {
                if (err) {
                    return callback(
                        new Error(`Error converting thumbnails: ${err}`));
                }

                callback(null, [
                    path.resolve(baseDir, "thumbs", fileName),
                    path.resolve(baseDir, "scaled", fileName),
                ]);
            });
        },

        hashImage(sourceFile, callback) {
            fs.readFile(sourceFile, (err, buffer) => {
                if (err) {
                    return callback(err);
                }

                callback(null, farmhash.hash32(buffer));
            });
        },

        processImage(sourceFile, baseDir, callback) {
            let hash;
            let imageFile;
            const existsError = new Error("Already exists.");

            async.series([
                // Generate a hash for the incoming image file
                (callback) => {
                    this.hashImage(sourceFile, (err, imageHash) => {
                        if (err) {
                            return callback(err);
                        }

                        hash = imageHash;
                        imageFile = path.resolve(baseDir, "images",
                            `${hash}.jpg`);

                        // Avoid doing the rest of this if it already exists
                        fs.stat(imageFile, (err, stats) => {
                            callback(stats ? existsError : null);
                        });
                    });
                },

                // Convert the image into our standard format
                (callback) => this.convert(fs.createReadStream(sourceFile),
                    imageFile, callback),

                // Generate thumbnails based on the image
                (callback) => this.makeThumbs(imageFile, callback),
            ], (err) => {
                callback(err === existsError ? null : err, hash);
            });
        },

        download(imageURL, callback) {
            let attemptNum = 0;

            const downloadImage = () => {
                attemptNum += 1;

                const tmpFile = genTmpFile();
                const outStream = fs.createWriteStream(tmpFile);

                outStream.on("finish", () => callback(null, tmpFile));

                const stream = request({
                    url: imageURL,
                    timeout: 10000,
                });

                stream.on("error", (err) => {
                    console.error("Error Downloading Image:",
                        JSON.stringify(err));
                    if (attemptNum < this.maxAttempts) {
                        downloadImage();
                    } else {
                        callback(new Error("Error Downloading image."));
                    }
                });

                stream.pipe(outStream);
            };

            downloadImage();
        },
    };
};

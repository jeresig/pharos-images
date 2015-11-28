"use strict";

const path = require("path");

const farmhash = require("farmhash");
const imageinfo = require("imageinfo");
const fs = require("graceful-fs");
const gm = require("gm");
const async = require("async");
const request = require("request");
const toArray = require("stream-to-array");

const genTmpFile = () => {
    return `/tmp/${(new Date).getTime()}${Math.random()}`;
};

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
            const [width, height] = size.split("x");

            return {
                width: parseFloat(width),
                height: parseFloat(height),
            };
        },

        getSize(fileName, callback) {
            fs.readFile(fileName, (err, data) => {
                if (err) {
                    return callback(err);
                }

                const {width, height} = imageinfo(data);

                callback(null, {
                    width: width,
                    height: height,
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
            const {width, height} = this.parseSize(process.env.THUMB_SIZE);

            this.convert(fs.createReadStream(imageFile), thumbFile, (img) => {
                return img.resize(width, height, ">")
                    .gravity("Center")
                    .extent(width, height);
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

        getPath(baseDir, file) {
            return path.relative(path.resolve(baseDir, ".."), file);
        },

        upload(baseDir, imageFile, callback) {
            let attemptNum = 0;
            const pathName = this.getPath(baseDir, imageFile);

            const uploadImage = () => {
                attemptNum += 1;

                core.s3.upload(imageFile, pathName, function(err) {
                    if (!err) {
                        return callback();
                    }

                    if (attemptNum < this.maxAttempts) {
                        uploadImage();
                    } else {
                        callback(new Error("Error Uploading Image."));
                    }
                });
            };

            uploadImage();
        },

        uploadImages(baseDir, files, callback) {
            async.map(files, (file, callback) => {
                this.upload(baseDir, file, callback);
            }, callback);
        },

        processImage(fileStream, baseDir, cdnSave, callback) {
            let imageHash;
            let imageFile;
            let extraFiles;
            const existsError = new Error("Already exists.");

            async.series([
                // Generate a hash for the incoming image file
                (callback) => {
                    toArray(fileStream, (err, parts) => {
                        const buffer = Buffer.concat(parts);
                        imageHash = farmhash.hash32(buffer);
                        imageFile = path.resolve(baseDir, "images",
                            `${imageHash}.jpg`);

                        // Avoid doing the rest of this if it already exists
                        if (fs.existsSync(imageFile)) {
                            return callback(existsError);
                        }

                        callback();
                    });
                },

                // Convert the image into our standard format
                (callback) => this.convert(fileStream, imageFile, callback),

                // Generate thumbnails based on the image
                (callback) => this.makeThumbs(imageFile, (err, files) => {
                    extraFiles = files;
                    callback(err);
                }),

                // Upload the images to a CDN, if requested
                (callback) => {
                    if (cdnSave) {
                        this.uploadImages(baseDir,
                            [imageFile].concat(extraFiles), callback);
                    } else {
                        callback();
                    }
                },
            ], (err) => {
                callback(err === existsError ? null : err, imageHash);
            });
        },

        downloadStream(stream, baseDir, cdnSave, callback) {
            let attemptNum = 0;

            const downloadImage = () => {
                attemptNum += 1;

                const tmpFile = genTmpFile();
                const outStream = fs.createWriteStream(tmpFile);

                outStream.on("finish", () =>
                    this.processImage(fs.createReadStream(tmpFile),
                        baseDir, cdnSave, callback));

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

        download(imageURL, baseDir, cdnSave, callback) {
            this.downloadStream(request({
                url: imageURL,
                timeout: 30000,
            }), baseDir, cdnSave, callback);
        },
    };
};

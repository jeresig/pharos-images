"use strict";

const path = require("path");
const crypto = require("crypto");

const farmhash = require("farmhash");
const imageinfo = require("imageinfo");
const fs = require("graceful-fs");
const gm = require("gm");
const async = require("async");
const request = require("request");

const genTmpFile = () => {
    return `/tmp/${(new Date).getTime()}${Math.random()}`;
};

module.exports = (lib) => {
    return {
        maxAttempts: 3,

        hashFile(file, callback) {
            fs.readFile(file, (err, data) => {
                callback(farmhash.hash32(data));
            });
        },

        convert(inputFile, outputFile, config, callback) {
            let stream = gm(fs.createReadStream(inputFile))
                .autoOrient();

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
            const nums = size.split("x");
            const width = parseFloat(nums[0]);
            const height = parseFloat(nums[1]);
            return {
                width: width,
                height: height
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
                    height: info.height
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
            const thumb = this.parseSize(process.env.THUMB_SIZE);

            this.convert(imageFile, thumbFile, (img) => {
                return img.resize(thumb.width, thumb.height, ">")
                    .gravity("Center")
                    .extent(thumb.width, thumb.height);
            }, callback);
        },

        makeScaled(baseDir, fileName, callback) {
            const imageFile = path.resolve(baseDir, "images", fileName);
            const scaledFile = path.resolve(baseDir, "scaled", fileName);
            const scaled = this.parseSize(process.env.SCALED_SIZE);

            this.convert(imageFile, scaledFile, (img) => {
                return img.resize(scaled.width, scaled.height, "^>");
            }, callback);
        },

        makeThumbs(fullPath, callback) {
            const baseDir = path.resolve(path.dirname(fullPath), "..");
            const fileName = path.basename(fullPath);

            async.series([
                (callback) => {
                    this.makeThumb(baseDir, fileName, callback);
                },
                (callback) => {
                    this.makeScaled(baseDir, fileName, callback);
                }
            ], (err) => {
                if (err) {
                    callback(new Error(`Error converting thumbnails: ${err}`));
                } else {
                    const thumbFile = path.resolve(baseDir, "thumbs", fileName);
                    const scaledFile = path.resolve(baseDir, "scaled", fileName);
                    callback(null, [thumbFile, scaledFile]);
                }
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

                lib.s3.upload(imageFile, pathName, function(err) {
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

        processImage(tmpFile, baseDir, cdnSave, callback) {
            this.hashFile(tmpFile, (hash) => {
                // TODO: Make sure that the file is a JPG
                const fileName = `${has}.jpg`;
                const imageFile = path.resolve(baseDir, "images", fileName);

                // Avoid doing all of this if it already exists
                if (fs.existsSync(imageFile)) {
                    return callback(null, hash);
                }

                this.convert(tmpFile, imageFile, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    this.makeThumbs(imageFile, (err, files) => {
                        if (err) {
                            return callback(err);
                        }

                        if (!cdnSave) {
                            return callback(err, hash);
                        }

                        this.uploadImages(baseDir, [imageFile].concat(files),
                            (err) => callback(err, hash));
                    });
                });
            });
        },

        downloadStream(stream, baseDir, cdnSave, callback) {
            let attemptNum = 0;

            const downloadImage = () => {
                attemptNum += 1;

                const tmpFile = genTmpFile();
                const outStream = fs.createWriteStream(tmpFile);

                outStream.on("finish", () =>
                    this.processImage(tmpFile, baseDir, cdnSave, callback));

                stream.on("error", () => {
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
                timeout: 30000
            }), baseDir, cdnSave, callback);
        }
    };
};
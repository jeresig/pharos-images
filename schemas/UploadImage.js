"use strict";

const path = require("path");

const async = require("async");

module.exports = (core) => {
    const Image = require("./Image")(core);

    const uploadName = "uploads";

    const UploadImage = Image.extend({}, {
        collection: uploadName,
    });

    const getDirBase = function() {
        return core.urls.genLocalFile(`sources/${uploadName}`);
    };

    UploadImage.methods.getFilePath = function() {
        return path.resolve(getDirBase(), `./images/${this.hash}.jpg`);
    };

    // We don't save the uploaded files in the index so we override this
    // method to use `fileSimilar` to re-query every time.
    UploadImage.methods.updateSimilarity = function(callback) {
        const file = this.getFilePath();

        core.similar.fileSimilar(file, (err, matches) => {
            /* istanbul ignore if */
            if (err) {
                return callback(err);
            }

            async.mapLimit(matches, 1, (match, callback) => {
                // Skip matches for the image itself
                if (match.id === this.hash) {
                    return callback();
                }

                core.models.Image.findOne({
                    hash: match.id,
                }, (err, image) => {
                    if (err || !image) {
                        return callback();
                    }

                    callback(null, {
                        _id: image._id,
                        score: match.score,
                    });
                });
            }, (err, matches) => {
                this.similarImages = matches.filter((match) => match);
                callback();
            });
        });
    };

    UploadImage.statics.fromFile = function(file, callback) {
        const sourceDir = getDirBase();

        this.processImage(file, sourceDir, (err, hash) => {
            if (err) {
                return callback(new Error("MALFORMED_IMAGE"));
            }

            this.getSize(file, (err, size) => {
                /* istanbul ignore if */
                if (err) {
                    return callback(new Error("MALFORMED_IMAGE"));
                }

                const width = size.width;
                const height = size.height;

                if (width <= 1 || height <= 1) {
                    return callback(new Error("EMPTY_IMAGE"));
                }

                if (width < 150 || height < 150) {
                    return callback(new Error("TOO_SMALL"));
                }

                const fileName = `${hash}.jpg`;
                const _id = `${uploadName}/${fileName}`;

                this.findById(_id, (err, image) => {
                    /* istanbul ignore if */
                    if (err) {
                        return callback(new Error("ERROR_RETRIEVING"));
                    }

                    if (image) {
                        return callback(null, image);
                    }

                    const model = new core.models.UploadImage({
                        _id,
                        source: uploadName,
                        fileName,
                        hash,
                        width,
                        height,
                    });

                    model.validate((err) => {
                        /* istanbul ignore if */
                        if (err) {
                            return callback(new Error("ERROR_SAVING"));
                        }

                        callback(null, model);
                    });
                });
            });
        });
    };

    return UploadImage;
};

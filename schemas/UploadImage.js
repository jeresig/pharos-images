"use strict";

const path = require("path");

const async = require("async");

const models = require("../lib/models");
const urls = require("../lib/urls");
const similar = require("../lib/similar");

const Image = require("./Image");

const uploadName = "uploads";
const collection = "uploadimages";

const UploadImage = Image.extend({
    // Source is always set to "uploads"
    source: {
        type: String,
        default: uploadName,
        required: true,
    },
}, {collection});

const getDirBase = function() {
    return urls.genLocalFile(`data/${uploadName}`);
};

UploadImage.methods.getFilePath = function() {
    return path.resolve(getDirBase(), `images/${this.hash}.jpg`);
};

// We don't save the uploaded files in the index so we override this
// method to use `fileSimilar` to re-query every time.
UploadImage.methods.updateSimilarity = function(callback) {
    const Image = models("Image");

    const file = this.getFilePath();

    similar.fileSimilar(file, (err, matches) => {
        /* istanbul ignore if */
        if (err) {
            return callback(err);
        }

        async.mapLimit(matches, 1, (match, callback) => {
            // Skip matches for the image itself
            if (match.id === this.hash) {
                return callback();
            }

            Image.findOne({
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
    const UploadImage = models("UploadImage");

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

                const model = new UploadImage({
                    _id,
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

module.exports = UploadImage;

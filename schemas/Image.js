"use strict";

const path = require("path");

module.exports = (core) => {
    const Source = core.models.Source;

    const Image = new core.db.schema({
        // An ID for the image in the form: SOURCE/IMAGENAME
        _id: String,

        // The date that this item was created
        created: {
            type: Date,
            default: Date.now,
        },

        // The date that this item was updated
        modified: {
            type: Date,
        },

        // The most recent batch in which the image was uploaded
        // NOTE(jeresig): This is not required as the image could have
        // been uploaded for use in a search.
        batch: core.db.schema.Types.ObjectId,

        // The source that the image is associated with
        source: {
            type: String,
            required: true,
        },

        // TODO: Migrate away from this.
        imageName: {
            type: String,
        },

        // The name of the original file (e.g. `foo.jpg`)
        fileName: {
            type: String,
            required: true,
        },

        // Full URL of where the image came.
        url: String,

        // The hashed contents of the image
        hash: {
            type: String,
            required: true,
        },

        // The width of the image
        width: {
            type: Number,
            required: true,
            min: 1,
        },

        // The height of the image
        height: {
            type: Number,
            required: true,
            min: 1,
        },

        // Similar images (as determined by image similarity)
        similarImages: [{
            // The ID of the visually similar image
            _id: {
                type: String,
                required: true,
            },

            // The similarity score between the images
            score: {
                type: Number,
                required: true,
                min: 1,
            },
        }],
    });

    Image.methods = {
        getFilePath() {
            return path.resolve(this.getSource().getDirBase(),
                `./images/${this.hash}.jpg`);
        },

        getOriginalURL() {
            return core.urls.genData(
                `/${this.source}/images/${this.hash}.jpg`);
        },

        getScaledURL() {
            return core.urls.genData(
                `/${this.source}/scaled/${this.hash}.jpg`);
        },

        getThumbURL() {
            return core.urls.genData(
                `/${this.source}/thumbs/${this.hash}.jpg`);
        },

        getSource() {
            return Source.getSource(this.source);
        },

        updateSimilarity(callback) {
            core.similar.similar(this.hash, (err, matches) => {
                if (err || !matches) {
                    return callback(err);
                }

                this.similarImages = matches
                    .filter((match) => match.id !== this._id);

                callback();
            });
        },

        indexSimilarity(callback) {
            core.similar.idIndexed(this.hash, (err, indexed) => {
                if (err || indexed) {
                    return callback(err);
                }

                const file = this.getFilePath();

                core.similar.add(file, this.hash, (err) => {
                    // Ignore small images, we just won't index them
                    if (err && err.type === "IMAGE_SIZE_TOO_SMALL") {
                        return callback();
                    }

                    return callback(err);
                });
            });
        },
    };

    Image.statics = {
        fromFile(batch, file, callback) {
            const fileName = path.basename(file);
            const source = batch.source;
            const _id = `${source}/${fileName}`;
            const sourceDir = Source.getSource(source).getDirBase();
            const warnings = [];

            this.findById(_id, (err, image) => {
                const creating = !image;

                core.images.processImage(file, sourceDir, (err, hash) => {
                    if (err) {
                        return callback(new Error(
                            "There was an error processing the image. " +
                            "Perhaps it is malformed in some way."
                        ));
                    }

                    hash = hash.toString();

                    // The same image was uploaded, we can just skip the rest
                    if (!creating && hash === image.hash) {
                        return callback(null, image);
                    }

                    core.images.getSize(file, (err, size) => {
                        if (err) {
                            return callback(new Error(
                                "There was an error getting the dimensions " +
                                "of the image."
                            ));
                        }

                        const width = size.width;
                        const height = size.height;

                        if (width === 0 || height === 0) {
                            return callback(new Error("The image is empty."));
                        }

                        const data = {
                            _id,
                            batch: batch._id,
                            source,
                            fileName,
                            hash,
                            width,
                            height,
                        };

                        if (creating) {
                            image = new core.models.Image(data);

                        } else {
                            warnings.push(
                                "A new version of the image was uploaded, " +
                                "replacing the old one."
                            );

                            image.set(data);
                        }

                        if (width < 150 || height < 150) {
                            warnings.push(
                                "The image is too small to work with the " +
                                "image similarity algorithm. It must be " +
                                "at least 150px on each side."
                            );
                        }

                        image.validate((err) => {
                            if (err) {
                                // TODO: Convert validation error into something
                                // useful.
                                return callback(err);
                            }

                            image.save((err, image) => {
                                if (err) {
                                    return callback(new Error(
                                        "Error saving image to the database."));
                                }

                                callback(null, image, warnings);
                            });
                        });
                    });
                });
            });
        },
    };

    return Image;
};

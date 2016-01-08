"use strict";

const path = require("path");

const async = require("async");

module.exports = (core) => {
    let sourceCache = [];
    const Artwork = core.models.Artwork;

    const Source = new core.db.schema({
        _id: String,
        url: String,
        name: String,
        nameKanji: String,
        shortName: String,
        shortKanji: String,
        description: String,
        location: String,
        types: [String],
        estNumArtworks: Number,
        inactive: Boolean,
        hideLinks: Boolean,
        linkTitle: String,
        linkText: String,
    });

    Source.methods = {
        getURL(locale) {
            return core.urls.gen(locale, `/source/${this._id}`);
        },

        getDirBase() {
            return core.urls.genLocalFile(this._id);
        },

        getFullName: function(locale) {
            return locale === "ja" && this.nameKanji || this.name;
        },

        getShortName: function(locale) {
            return locale === "ja" && this.shortKanji || this.shortName;
        },

        cacheNumArtworks: function(callback) {
            Artwork.count({source: this._id}, (err, num) => {
                this.numArtworks = num || 0;
                callback(err);
            });
        },

        getImage(file, callback) {
            const fileName = path.basename(file);
            const _id = `${this._id}/${fileName}`;

            core.models.UploadedImage.findById(_id, callback);
        },

        processImage(file, callback) {
            const fileName = path.basename(file);
            const _id = `${this._id}/${fileName}`;
            const sourceDir = this.getDirBase();
            const warnings = [];

            core.models.Image.findById(_id, (err, image) => {
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
                            source: this._id,
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

                        image.save(callback);
                    });
                });
            });
        },
    };

    Source.statics = {
        cacheSources(callback) {
            core.models.Source.find({}, (err, sources) => {
                sourceCache = sources;

                async.eachLimit(sources, 2, (source, callback) => {
                    source.cacheNumArtworks(callback);
                }, () => {
                    callback(err, sources);
                });
            });
        },

        getSources() {
            return sourceCache;
        },

        getSource(sourceName) {
            // Return the object if it's already a Source object
            if (sourceName && sourceName._id) {
                return sourceName;
            }

            const sources = this.getSources();

            for (let i = 0; i < sources.length; i++) {
                const source = sources[i];
                if (source._id === sourceName) {
                    return source;
                }
            }

            throw new Error(`Source not found: ${sourceName}`);
        },
    };

    return Source;
};

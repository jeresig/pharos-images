"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const async = require("async");
const request = require("request");
const formidable = require("formidable");

// The maximum number of times to try downloading an image
const MAX_ATTEMPTS = 3;

// How long to wait, in milliseconds, for the download
const DOWNLOAD_TIMEOUT = 10000;

module.exports = (core, app) => {
    const Upload = core.models.Upload;
    const UploadImage = core.models.UploadImage;

    const genTmpFile = () => path.join(os.tmpdir(),
        (new Date).getTime().toString());

    const handleUpload = (req, res, next) => (err, file) => {
        /* istanbul ignore if */
        if (err) {
            return next(err);
        }

        UploadImage.fromFile(file, (err, image) => {
            // TODO: Display better error message
            if (err) {
                return next(new Error(req.gettext("Error processing image.")));
            }

            Upload.fromImage(image, (err, upload) => {
                /* istanbul ignore if */
                if (err) {
                    return next(err);
                }

                image.save((err) => {
                    /* istanbul ignore if */
                    if (err) {
                        return next(err);
                    }

                    // TODO: Add in uploader's user name (once those exist)
                    upload.updateSimilarity(() => {
                        upload.save(() => res.redirect(
                            upload.getURL(req.lang)));
                    });
                });
            });
        });
    };

    const download = (imageURL, callback) => {
        let attemptNum = 0;

        const downloadImage = () => {
            attemptNum += 1;

            const tmpFile = genTmpFile();
            const outStream = fs.createWriteStream(tmpFile);

            outStream.on("close", () => callback(null, tmpFile));

            const stream = request({
                url: imageURL,
                timeout: DOWNLOAD_TIMEOUT,
            });

            stream.on("response", (res) => {
                if (res.statusCode === 200) {
                    return stream.pipe(outStream);
                }

                if (attemptNum < MAX_ATTEMPTS) {
                    downloadImage();
                } else {
                    callback(new Error("Error Downloading image."));
                }
            });
        };

        downloadImage();
    };

    return {
        urlUpload(req, res, next) {
            const url = req.query.url;

            // Handle the user accidentally hitting enter
            if (!url || url === "http://") {
                return next(new Error(req.gettext("No image URL specified.")));
            }

            download(url, (err, file) =>
                handleUpload(req, res, next)(err, file));
        },

        fileUpload(req, res, next) {
            const form = new formidable.IncomingForm();
            form.encoding = "utf-8";
            form.maxFieldsSize = process.env.MAX_UPLOAD_SIZE;

            form.parse(req, (err, fields, files) => {
                /* istanbul ignore if */
                if (err) {
                    return next(new Error(
                        req.gettext("Error processing upload.")));
                }

                if (files && files.file && files.file.path &&
                        files.file.size > 0) {
                    handleUpload(req, res, next)(null, files.file.path);

                } else {
                    next(new Error(req.gettext("No image specified.")));
                }
            });
        },

        show(req, res) {
            // TODO: Update similar matches if new image data has
            // since come in since it was last updated.
            const _id = `uploads/${req.params.upload}`;
            Upload.findById(_id, (err, upload) => {
                if (err || !upload) {
                    return res.status(404).render("error", {
                        title: req.gettext("Uploaded image not found."),
                    });
                }

                upload.loadImages(true, () => {
                    async.eachLimit(upload.similarArtworks, 4,
                        (similar, callback) => {
                            similar.artwork.loadImages(false, callback);
                        }, () => {
                            res.render("upload", {
                                title: upload.getTitle(req),
                                upload,
                                image: upload.images[0],
                                noIndex: true,
                                artworks: [upload]
                                    .concat(upload.similarArtworks
                                        .map((similar) => similar.artwork)),
                            });
                        });
                });
            });
        },

        routes() {
            app.get("/uploads/:upload", this.show);
            app.get("/url-upload", this.urlUpload);
            app.post("/file-upload", this.fileUpload);
        },
    };
};

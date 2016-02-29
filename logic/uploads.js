"use strict";

const os = require("os");
const path = require("path");

const async = require("async");
const fs = require("graceful-fs");
const request = require("request");
const formidable = require("formidable");

// The maximum number of times to try downloading an image
const MAX_ATTEMPTS = 3;

// How long to wait, in milliseconds, for the download
const DOWNLOAD_TIMEOUT = 10000;

module.exports = (core, app) => {
    const Upload = core.models.Upload;
    const UploadImage = core.models.UploadImage;

    const genTmpFile = () => {
        return path.join(os.tmpdir(), (new Date).getTime());
    };

    const handleUpload = (req, res, next) => (err, file) => {
        if (err) {
            return next(err);
        }

        UploadImage.fromFile(file, (err, image) => {
            // TODO: Display better error message
            if (err) {
                console.error(err);
                return next(new Error(
                    req.gettext("Error processing image.")));
            }

            const _id = image._id.replace(/\.jpg$/, "");

            // Check to see if image already exists and redirect
            // if it does.
            Upload.findById(_id, (err, existing) => {
                if (existing) {
                    return res.redirect(existing.getURL(req.lang));
                }

                // TODO: Add in uploader's user name (once those exist)
                const upload = new Upload({
                    _id,
                    source: "uploads",
                    images: [image._id],
                });

                upload.updateSimilarity(() => {
                    upload.save(() => res.redirect(
                        upload.getURL(req.lang)));
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

            outStream.on("finish", () => callback(null, tmpFile));

            const stream = request({
                url: imageURL,
                timeout: DOWNLOAD_TIMEOUT,
            });

            stream.on("error", (err) => {
                console.error("Error Downloading Image:",
                    JSON.stringify(err));
                if (attemptNum < MAX_ATTEMPTS) {
                    downloadImage();
                } else {
                    callback(new Error("Error Downloading image."));
                }
            });

            stream.pipe(outStream);
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
            Upload.findById(req.params.upload)
                .populate("images")
                .populate("similarArtworks.artwork")
                .exec((err, upload) => {
                    if (err || !upload) {
                        return res.status(404).render("error", {
                            title: req.gettext("Uploaded image not found."),
                        });
                    }

                    async.eachLimit(upload.similarArtworks, 4,
                        (similar, callback) => {
                            similar.artwork.populate("images", callback);
                        }, () => {
                            res.render("upload", {
                                title: upload.getTitle(req),
                                noIndex: true,
                                artworks: [upload]
                                    .concat(upload.similarArtworks
                                        .map((similar) => similar.artwork)),
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

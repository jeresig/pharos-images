"use strict";

const formidable = require("formidable");

module.exports = (core, app) => {
    const Upload = core.models.Upload;

    const handleUpload = function(req, callback) {
        const form = new formidable.IncomingForm();
        form.encoding = "utf-8";
        form.maxFieldsSize = process.env.MAX_UPLOAD_SIZE;

        form.parse(req, (err, fields, files) => {
            // NOTE: Is the query string also handled by formidable?
            const url = fields.url || req.query.url;

            if (files && files.file) {
                callback(null, files.file.path);

            } else if (url) {
                // Handle the user accidentally hitting enter
                if (url === "http://") {
                    return callback({
                        err: req.i18n.__("No file specified."),
                    });
                }

                core.images.download(url, callback);

            } else {
                callback({err: req.i18n.__("No file specified.")});
            }
        });
    };

    return {
        load(req, res, next, id) {
            Upload.findById(id).exec((err, upload) => {
                if (err) {
                    return next(err);
                }

                if (!upload) {
                    console.log("not found");
                    return next(new Error("not found"));
                }

                upload.populate("similarArtworks.artwork", (err) => {
                    req.upload = upload;
                    next();
                });
            });
        },

        searchUpload(req, res) {
            // TODO: Add in uploader's user name (once those exist)
            const upload = new Upload({
                source: "uploads",
            });

            handleUpload(req, (err, file) => {
                if (err) {
                    // TODO: Show some sort of error message
                    console.error("Error Uploading Image:", err);
                    return res.redirect(
                        core.urls.gen(req.i18n.getLocale(), "/"));
                }

                core.images.processImage(file, upload.sourceDirBase(),
                    false, (err, id) => {
                        if (err) {
                            // TODO: Show some sort of error message
                            console.error("Error Processing Image:", err);
                            return res.redirect(
                                core.urls.gen(req.i18n.getLocale(), "/"));
                        }

                        upload._id = id;

                        upload.addImage(file, id, (err) => {
                            if (err) {
                                // TODO: Show some sort of error message
                                console.error("Error Adding Image:", err);
                                return res.redirect(
                                    core.urls.gen(req.i18n.getLocale(), "/"));
                            }

                            upload.syncSimilarity(() => {
                                upload.save(() => res.redirect(
                                    upload.getURL(req.i18n.getLocale())));
                            });
                        });
                    });
            });
        },

        show(req, res) {
            // TODO: Update similar matches if new image data has
            // since come in since it was last updated.
            res.render("uploads/show", {
                title: req.i18n.__("Uploaded Image"),
                artwork: req.upload,
            });
        },
    };
};

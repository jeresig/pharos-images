"use strict";

const formidable = require("formidable");

module.exports = (core, app) => {
    const Upload = core.models.Upload;

    const handleUpload = (req, res, next) => (err, file) => {
        if (err) {
            return next(err);
        }

        // TODO: Add in uploader's user name (once those exist)
        const upload = new Upload({
            source: "uploads",
        });
        const sourceDir = upload.sourceDirBase();

        core.images.processImage(file, sourceDir, (err, id) => {
            if (err) {
                console.error(err);
                return next(new Error(
                    req.gettext("Error processing image.")));
            }

            upload._id = id;

            upload.addImage(file, (err) => {
                if (err) {
                    console.error(err);
                    return next(new Error(
                        req.gettext("Error adding image.")));
                }

                upload.syncSimilarity(() => {
                    upload.save(() => res.redirect(
                        upload.getURL(req.lang)));
                });
            });
        });
    };

    return {
        urlUpload(req, res, next) {
            const url = req.query.url;

            if (url) {
                // Handle the user accidentally hitting enter
                if (url === "http://") {
                    return next(new Error(
                        req.gettext("No image URL specified.")));
                }

                core.images.download(url,
                    (err, file) => handleUpload(req, res, next)(err, file));

            } else {
                next(new Error(req.gettext("No image URL specified.")));
            }
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

        show(req, res, next) {
            // TODO: Update similar matches if new image data has
            // since come in since it was last updated.
            Upload.findById(req.params.upload)
                .populate("similarArtworks.artwork")
                .exec((err, upload) => {
                    if (err || !upload) {
                        return res.status(404).render("error", {
                            title: req.gettext("Uploaded image not found."),
                        });
                    }

                    res.render("upload", {
                        title: req.gettext("Uploaded Image"),
                        artwork: upload,
                    });
                });
        },

        routes() {
            app.get("/uploads/:upload", this.show);
            app.post("/url-upload", this.urlUpload);
            app.post("/file-upload", this.fileUpload);
        },
    };
};

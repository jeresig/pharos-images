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
                        err: req.gettext("No file specified."),
                    });
                }

                core.images.download(url, callback);

            } else {
                callback({err: req.gettext("No file specified.")});
            }
        });
    };

    return {
        searchUpload(req, res) {
            // TODO: Add in uploader's user name (once those exist)
            const upload = new Upload({
                source: "uploads",
            });
            const sourceDir = upload.sourceDirBase();

            handleUpload(req, (err, file) => {
                if (err) {
                    // TODO: Show some sort of error message
                    console.error("Error Uploading Image:", err);
                    return res.redirect(core.urls.gen(req.lang, "/"));
                }

                core.images.processImage(file, sourceDir, (err, id) => {
                    if (err) {
                        // TODO: Show some sort of error message
                        console.error("Error Processing Image:", err);
                        return res.redirect(core.urls.gen(req.lang, "/"));
                    }

                    upload._id = id;

                    upload.addImage(file, (err) => {
                        if (err) {
                            // TODO: Show some sort of error message
                            console.error("Error Adding Image:", err);
                            return res.redirect(core.urls.gen(req.lang, "/"));
                        }

                        upload.syncSimilarity(() => {
                            upload.save(() => res.redirect(
                                upload.getURL(req.lang)));
                        });
                    });
                });
            });
        },

        show(req, res, next) {
            // TODO: Update similar matches if new image data has
            // since come in since it was last updated.
            Upload.findById(res.param.upload)
                .populate("similarArtworks.artwork")
                .exec((err, upload) => {
                    if (err || !upload) {
                        return res.render(404, {
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
            app.post("/upload", this.searchUpload);
        },
    };
};

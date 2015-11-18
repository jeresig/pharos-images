"use strict";

const fs = require("fs");

const request = require("request");
const formidable = require("formidable");

module.exports = (core, app) => {
    const Upload = core.db.model("Upload");

    const handleUpload = function(req, baseDir, callback) {
        const form = new formidable.IncomingForm();
        form.encoding = "utf-8";
        form.maxFieldsSize = process.env.MAX_UPLOAD_SIZE;

        form.parse(req, (err, fields, files) => {
            // NOTE: Is the query string also handled by formidable?
            const url = fields.url || req.query.url;

            // Handle the user accidentally hitting enter
            if (url && url === "http://") {
                return callback({err: "No file specified."});
            }

            const stream = (url ?
                request({url: url, timeout: 5000}) :
                fs.createReadStream(files.file.path));

            core.images.downloadStream(stream, baseDir, true, callback);
        });
    };

    return {
        load(req, res, next, id) {
            Upload.findById(`uploads/${id}`).exec((err, upload) => {
                if (err) {
                    return next(err);
                }
                if (!upload) {
                    console.log("not found");
                    return next(new Error("not found"));
                }
                req.upload = upload;
                next();
            });
        },

        searchUpload(req, res) {
            handleUpload(req, Upload.getDataDir(), (err, id) => {
                if (err) {
                    // TODO: Show some sort of error message
                    return res.redirect(
                        core.urls.gen(req.i18n.getLocale(), "/"));
                }

                // TODO: Add in uploader's user name (once those exist)
                const upload = new Upload({
                    _id: "uploads/" + id,
                    imageName: id,
                    source: "uploads",
                });

                upload.save(() => {
                    res.redirect(upload.getURL(req.i18n.getLocale()));
                });
            });
        },

        show(req, res) {
            // Update similar matches on every load
            req.upload.updateSimilar(() => {
                req.upload.save(() => {
                    res.render("images/show", {
                        image: req.upload,
                        results: req.upload.similar,
                    });
                });
            });
        },
    };
};

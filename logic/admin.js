"use strict";

const formidable = require("formidable");

module.exports = function(core, app) {
    const Source = core.models.Source;
    const Batch = core.models.Batch;
    const Data = core.models.Data;

    return {
        admin(req, res, next) {
            // TODO(jeresig): Only allow certain users to view this page
            let source;

            try {
                source = Source.getSource(req.params.source);

            } catch (e) {
                return res.status(404).render("error", {
                    title: req.gettext("Source not found."),
                });
            }

            Promise.all([
                Batch.find({source: source._id}).sort({created: "desc"}).exec(),
                Data.find({source: source._id}).sort({created: "desc"}).exec(),
            ]).then((batches, datas) => {
                res.render("admin", {
                    source,
                    batches,
                    datas,
                });
            }).catch((err) => {
                next(new Error(req.gettext("Error retrieving records.")));
            });
        },

        uploadBatch(req, res, next) {
            // TODO(jeresig): Only allow certain users to upload batches
            const source = req.params.source;

            try {
                Source.getSource(source);

            } catch (e) {
                return res.status(404).render("error", {
                    title: req.gettext("Source not found."),
                });
            }

            const form = new formidable.IncomingForm();
            form.encoding = "utf-8";
            form.maxFieldsSize = process.env.MAX_UPLOAD_SIZE;

            form.parse(req, (err, fields, files) => {
                if (err) {
                    return next(new Error(
                        req.gettext("Error processing zip file.")));
                }

                const zipField = files && files.zipField;

                if (!zipField || !zipField.path || zipField.size === 0) {
                    return next(
                        new Error(req.gettext("No zip file specified.")));
                }

                const zipFile = zipFile.path;
                const fileName = zipFile.name;

                const batch = new Batch({
                    source,
                    zipFile,
                    fileName,
                    state: "started",
                });

                batch.save((err) => {
                    if (err) {
                        return next(new Error(
                            req.gettext("Error saving zip file.")));
                    }

                    // TODO: Come up with a beter redirect
                    // TODO: Display a message stating that the upload
                    // was successful.
                    res.redirect(`/source/${source._id}/admin`);
                });
            });
        },

        routes() {
            app.get("/source/:source/admin", this.admin);
            app.post("/source/:source/upload-batch", this.uploadBatch);
        },
    };
};

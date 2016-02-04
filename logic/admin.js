"use strict";

const fs = require("fs");

const formidable = require("formidable");
const JSONStream = require("JSONStream");

module.exports = function(core, app) {
    const Source = core.models.Source;
    const ImageImport = core.models.ImageImport;
    const ArtworkImport = core.models.ArtworkImport;

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
                ImageImport.find({source: source._id})
                    .sort({created: "desc"}).exec(),
                ArtworkImport.find({source: source._id})
                    .sort({created: "desc"}).exec(),
            ]).then((results) => {
                const imageImport = results[0];
                const artworkImport = results[1];

                res.render("admin", {
                    source,
                    imageImport,
                    artworkImport,
                });
            }).catch((err) => {
                next(new Error(req.gettext("Error retrieving records.")));
            });
        },

        uploadImages(req, res, next) {
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

                const batch = new ImageImport({
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
                    res.redirect(`/source/${source}/admin`);
                });
            });
        },

        uploadData(req, res, next) {
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
                        req.gettext("Error processing data file.")));
                }

                const dataField = files && files.dataField;

                if (!dataField || !dataField.path || dataField.size === 0) {
                    return next(
                        new Error(req.gettext("No data file specified.")));
                }

                const dataFile = dataField.path;
                const fileName = dataField.name;
                const results = [];

                fs.createReadStream(dataFile)
                    .pipe(JSONStream.parse("*"))
                    .on("data", (data) => {
                        results.push({
                            data,
                            result: "unknown",
                        });
                    })
                    .on("error", (err) => {
                        this.destroy();
                        // TODO(jeresig): Transmit useful error message back
                        console.error(err);
                        next(new Error("Error reading data from the file."));
                    })
                    .on("end", () => {
                        const batch = new ArtworkImport({
                            source,
                            fileName,
                            results,
                            state: "started",
                        });

                        batch.save((err) => {
                            if (err) {
                                console.error(err);
                                return next(new Error(
                                    req.gettext("Error saving data file.")));
                            }

                            // TODO: Come up with a beter redirect
                            // TODO: Display a message stating that the upload
                            // was successful.
                            res.redirect(`/source/${source}/admin`);
                        });
                    });
            });
        },

        routes() {
            app.get("/source/:source/admin", this.admin);
            app.post("/source/:source/upload-images", this.uploadImages);
            app.post("/source/:source/upload-data", this.uploadData);
        },
    };
};

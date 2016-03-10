"use strict";

const fs = require("fs");

const formidable = require("formidable");

module.exports = function(core, app) {
    const Source = core.models.Source;
    const ImageImport = core.models.ImageImport;
    const ArtworkImport = core.models.ArtworkImport;

    return {
        admin(req, res, next) {
            const source = req.source;
            const batchState = (batch) => batch.getCurState().name(req);

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
                    batchState,
                });
            })
            /* istanbul ignore next */
            .catch(() => {
                next(new Error(req.gettext("Error retrieving records.")));
            });
        },

        import(req, res) {
            const batchState = (batch) => batch.getCurState().name(req);

            if (req.query.artworks) {
                ArtworkImport.findById(req.query.artworks, (err, batch) => {
                    if (err || !batch) {
                        return res.status(404).render("error", {
                            title: req.gettext("Import not found."),
                        });
                    }

                    res.render("import-artworks", {
                        batch,
                        results: batch.getFilteredResults(),
                        expanded: req.query.expanded,
                        batchState,
                    });
                });

            } else if (req.query.images) {
                ImageImport.findById(req.query.images, (err, batch) => {
                    if (err || !batch) {
                        return res.status(404).render("error", {
                            title: req.gettext("Import not found."),
                        });
                    }

                    res.render("import-images", {
                        batch,
                        results: batch.getFilteredResults(),
                        batchState,
                    });
                });

            } else {
                res.status(404).render("error", {
                    title: req.gettext("Import not found."),
                });
            }
        },

        uploadImages(req, res, next) {
            const source = req.source;

            const form = new formidable.IncomingForm();
            form.encoding = "utf-8";
            form.maxFieldsSize = process.env.MAX_UPLOAD_SIZE;

            form.parse(req, (err, fields, files) => {
                /* istanbul ignore if */
                if (err) {
                    return next(new Error(
                        req.gettext("Error processing zip file.")));
                }

                const zipField = files && files.zipField;

                if (!zipField || !zipField.path || zipField.size === 0) {
                    return next(
                        new Error(req.gettext("No zip file specified.")));
                }

                const zipFile = zipField.path;
                const fileName = zipField.name;

                const batch = ImageImport.fromFile(fileName, source._id);
                batch.zipFile = zipFile;

                batch.save((err) => {
                    /* istanbul ignore if */
                    if (err) {
                        return next(new Error(
                            req.gettext("Error saving zip file.")));
                    }

                    res.redirect(batch.getURL(req.lang));
                });
            });
        },

        uploadData(req, res, next) {
            const source = req.source;

            const form = new formidable.IncomingForm();
            form.encoding = "utf-8";
            form.multiples = true;
            form.maxFieldsSize = process.env.MAX_UPLOAD_SIZE;

            form.parse(req, (err, fields, files) => {
                /* istanbul ignore if */
                if (err) {
                    return next(new Error(
                        req.gettext("Error processing data files.")));
                }

                const inputFiles = (Array.isArray(files.files) ?
                    files.files :
                    files.files ? [files.files] : [])
                    .filter((file) => file.path && file.size > 0);

                if (inputFiles.length === 0) {
                    return next(
                        new Error(req.gettext("No data files specified.")));
                }

                const fileName = inputFiles
                    .map((file) => file.name).join(", ");
                const inputStreams = inputFiles
                    .map((file) => fs.createReadStream(file.path));

                const batch = ArtworkImport.fromFile(fileName, source._id);

                batch.setResults(inputStreams, (err) => {
                    /* istanbul ignore if */
                    if (err) {
                        return next(new Error(
                            req.gettext("Error saving data file.")));
                    }

                    batch.save((err) => {
                        /* istanbul ignore if */
                        if (err) {
                            return next(new Error(
                                req.gettext("Error saving data file.")));
                        }

                        res.redirect(batch.getURL(req.lang));
                    });
                });
            });
        },

        routes() {
            // TODO(jeresig): Only allow certain users to access these pages
            app.get("/source/:source/admin", this.admin);
            app.get("/source/:source/import", this.import);
            app.post("/source/:source/upload-images", this.uploadImages);
            app.post("/source/:source/upload-data", this.uploadData);

            app.param("source", (req, res, next, id) => {
                try {
                    req.source = Source.getSource(id);
                    next();

                } catch (e) {
                    return res.status(404).render("error", {
                        title: req.gettext("Source not found."),
                    });
                }
            });
        },
    };
};

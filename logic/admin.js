"use strict";

const fs = require("fs");

const async = require("async");
const formidable = require("formidable");
const jdp = require("jsondiffpatch");
//const passport = require("passport");

module.exports = function(core, app) {
    const Source = core.models.Source;
    const ImageImport = core.models.ImageImport;
    const ArtworkImport = core.models.ArtworkImport;

    return {
        admin(req, res, next) {
            const source = req.source;
            const batchState = (batch) => batch.getCurState().name(req);
            const batchError = (batch) => batch.getError(req);

            async.parallel([
                (callback) => ImageImport.find({source: source._id}, null,
                    {sort: {created: "desc"}}, callback),
                (callback) => ArtworkImport.find({source: source._id}, null,
                    {sort: {created: "desc"}}, callback),
            ], (err, results) => {
                /* istanbul ignore if */
                if (err) {
                    return next(new Error(
                        req.gettext("Error retrieving records.")));
                }

                const imageImport = results[0];
                const artworkImport = results[1];

                res.render("admin", {
                    source,
                    imageImport,
                    artworkImport,
                    batchState,
                    batchError,
                });
            });
        },

        import(req, res) {
            const batchState = (batch) => batch.getCurState().name(req);

            if (req.query.artworks) {
                const batchError = (err) => ArtworkImport.getError(req, err);

                ArtworkImport.findById(req.query.artworks, (err, batch) => {
                    if (err || !batch) {
                        return res.status(404).render("error", {
                            title: req.gettext("Import not found."),
                        });
                    }

                    if (req.query.abandon) {
                        return batch.abandon(() => {
                            res.redirect(req.source.getAdminURL(req.lang));
                        });

                    } else if (req.query.finalize) {
                        return batch.manuallyApprove(() => {
                            res.redirect(req.source.getAdminURL(req.lang));
                        });
                    }

                    res.render("import-artworks", {
                        batch,
                        results: batch.getFilteredResults(),
                        expanded: req.query.expanded,
                        batchState,
                        batchError,
                        diff: (delta) => jdp.formatters.html.format(delta),
                    });
                });

            } else if (req.query.images) {
                const batchError = (err) => ImageImport.getError(req, err);

                ImageImport.findById(req.query.images, (err, batch) => {
                    if (err || !batch) {
                        return res.status(404).render("error", {
                            title: req.gettext("Import not found."),
                        });
                    }

                    const results = batch.results
                        .filter((result) => !!result.model);
                    const toPopulate = req.query.expanded === "images" ?
                        results :
                        results.slice(0, 8);

                    async.eachLimit(toPopulate, 4, (result, callback) => {
                        const imageID = result.model;

                        if (typeof imageID !== "string") {
                            return process.nextTick(callback);
                        }

                        core.models.Image.findById(imageID, (err, image) => {
                            if (image) {
                                result.model = image;
                            }

                            callback();
                        });
                    }, () => {
                        res.render("import-images", {
                            batch,
                            results: batch.getFilteredResults(),
                            batchState,
                            batchError,
                        });
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
            /*
            // Only allow certain users to access these pages
            const auth = (req, res, next) => {
                passport.authenticate("local", () => {
                    if (!req.user) {
                        req.session.redirectTo = req.originalUrl;
                        res.redirect(core.urls.gen(req.lang, "/login"));
                    } else if (req.user.sourceAdmin
                            .indexOf(req.params.source) < 0) {
                        next(new Error(req.gettext("Authorization required.")));
                    } else {
                        next();
                    }
                })(req, res, next);
            };
            */

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

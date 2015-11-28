"use strict";

module.exports = function(core, app) {
    const Artwork = core.db.model("Artwork");
    const search = require("./shared/search")(core, app);

    return {
        load(req, res, next, artworkName) {
            Artwork.findById(`${req.params.sourceId}/${artworkName}`)
                .populate("similarArtworks.artwork")
                .exec((err, image) => {
                    if (err) {
                        return next(err);
                    }
                    if (!image) {
                        console.log("not found");
                        return next(new Error("not found"));
                    }
                    req.image = image;
                    next();
                });
        },

        search(req, res) {
            const query = req.query.filter;
            let title = req.i18n.__("Results for '%s'", query || "*");

            if (req.query.artist) {
                title = req.i18n.__("Artist '%s'", req.query.artist);
            }

            search(req, res, {
                title: title,
                desc: req.i18n.__("Artworks matching '%s'.", query),
            });
        },

        show(req, res) {
            res.render("artworks/show", {
                title: req.image.getTitle(req.i18n.getLocale()),
                artwork: req.image,
            });
        },
    };
};

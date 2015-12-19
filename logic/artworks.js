"use strict";

module.exports = function(core, app) {
    const Artwork = core.models.Artwork;
    const search = require("./shared/search")(core, app);
    const types = require("./shared/types");

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

        search,

        byType(req, res) {
            const type = types[req.query.type || req.params.type];

            if (!type) {
                return res.render(404);
            }

            search(req, res);
        },

        show(req, res) {
            res.render("artworks/show", {
                title: req.image.getTitle(req.lang),
                artwork: req.image,
            });
        },
    };
};

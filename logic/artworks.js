"use strict";

module.exports = function(core, app) {
    const Artwork = core.models.Artwork;
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
            let title = req.format(req.gettext("Results for '%(query)s'"),
                {query: query || "*"});

            if (!query) {
                title = req.gettext("All Artworks");
            }

            if (req.query.artist) {
                title = req.format(req.gettext("Artist '%(artist)s'"),
                    {artist: req.query.artist});
            }

            search(req, res, {
                title: title,
                desc: req.format(req.gettext("Artworks matching '%(query)s'."),
                    {query: query}),
            });
        },

        show(req, res) {
            res.render("artworks/show", {
                title: req.image.getTitle(res.locals.lang),
                artwork: req.image,
            });
        },
    };
};

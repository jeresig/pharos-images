"use strict";

module.exports = function(core, app) {
    const Artwork = core.models.Artwork;
    const Source = core.models.Source;

    const cache = require("../server/middlewares/cache");
    const search = require("./shared/search")(core, app);
    const types = require("./shared/types");

    return {
        search,

        byType(req, res) {
            const type = types[req.query.type || req.params.type];

            if (!type) {
                return res.status(404).render("error", {
                    title: req.gettext("Type not found."),
                });
            }

            search(req, res);
        },

        bySource(req, res) {
            let source;

            try {
                source = Source.getSource(req.params.source);

            } catch (e) {
                return res.status(404).render("error", {
                    title: req.gettext("Source not found."),
                });
            }

            search(req, res, {
                url: source.url,
            });
        },

        show(req, res, next) {
            const id = `${req.params.source}/${req.params.artworkName}`;

            Artwork.findById(id)
                .populate("similarArtworks.artwork")
                .exec((err, image) => {
                    if (err || !image) {
                        return res.status(404).render("error", {
                            title: req.gettext("Artwork not found."),
                        });
                    }

                    res.render("artwork", {
                        title: image.getTitle(req.lang),
                        artwork: image,
                    });
                });
        },

        routes() {
            app.get("/search", cache(1), this.search);
            app.get("/artworks/:source/:artworkName", this.show);
            app.get("/type/:type", cache(1), this.byType);
            app.get("/source/:source", cache(1), this.bySource);
        },
    };
};

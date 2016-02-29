"use strict";

const async = require("async");

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

        show(req, res) {
            const compare = ("compare" in req.query);
            const id = `${req.params.source}/${req.params.artworkName}`;

            Artwork.findById(id)
                .populate("images")
                .populate("similarArtworks.artwork")
                .exec((err, artwork) => {
                    if (err || !artwork) {
                        return res.status(404).render("error", {
                            title: req.gettext("Artwork not found."),
                        });
                    }

                    const title = artwork.getTitle(req);

                    // Sort the similar artworks by score
                    artwork.similarArtworks = artwork.similarArtworks
                        .sort((a, b) => b.score - a.score);

                    if (compare) {
                        async.eachLimit(artwork.similarArtworks, 4,
                            (similar, callback) => {
                                similar.artwork.populate("images", callback);
                            }, () => {
                                res.render("artwork", {
                                    title,
                                    noIndex: true,
                                    artworks: [artwork]
                                        .concat(artwork.similarArtworks
                                            .map((similar) => similar.artwork)),
                                });
                            });
                    } else {
                        res.render("artwork", {
                            title,
                            artworks: [artwork],
                            similar: artwork.similarArtworks,
                        });
                    }
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

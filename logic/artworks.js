"use strict";

const async = require("async");

const models = require("../lib/models");
const config = require("../lib/config");

module.exports = function(app) {
    const Artwork = models("Artwork");
    const Source = models("Source");

    const cache = require("../server/middlewares/cache");
    const search = require("./shared/search");
    const types = config.types;

    return {
        search,

        byType(req, res) {
            const type = types[req.params.type];

            if (!type) {
                return res.status(404).render("Error", {
                    title: req.gettext("Type not found."),
                });
            }

            search(req, res);
        },

        bySource(req, res) {
            search(req, res, {
                url: req.source.url,
            });
        },

        show(req, res) {
            const compare = ("compare" in req.query);
            const id = `${req.params.source}/${req.params.artworkName}`;

            Artwork.findById(id, (err, artwork) => {
                if (err || !artwork) {
                    return res.status(404).render("Error", {
                        title: req.gettext("Artwork not found."),
                    });
                }

                artwork.loadImages(true, () => {
                    // TODO: Handle error loading images?
                    const title = artwork.getTitle(req);

                    // Sort the similar artworks by score
                    artwork.similarArtworks = artwork.similarArtworks
                        .sort((a, b) => b.score - a.score);

                    if (!compare) {
                        return res.render("Artwork", {
                            title,
                            compare: false,
                            artworks: [artwork],
                            similar: artwork.similarArtworks,
                        });
                    }

                    async.eachLimit(artwork.similarArtworks, 4,
                        (similar, callback) => {
                            similar.artwork.loadImages(false, callback);
                        }, () => {
                            res.render("Artwork", {
                                title,
                                compare: true,
                                noIndex: true,
                                similar: [],
                                artworks: [artwork]
                                    .concat(artwork.similarArtworks
                                        .map((similar) => similar.artwork)),
                            });
                        });
                });
            });
        },

        routes() {
            app.get("/search", cache(1), this.search);
            app.get("/artworks/:source/:artworkName", this.show);
            app.get("/type/:type", cache(1), this.byType);
            app.get("/source/:source", cache(1), this.bySource);

            // NOTE(jeresig): This is also used by the source admin pages
            // to extract the source from the URL.
            app.param("source", (req, res, next, id) => {
                try {
                    req.source = Source.getSource(id);
                    next();

                } catch (e) {
                    return res.status(404).render("Error", {
                        title: req.gettext("Source not found."),
                    });
                }
            });
        },
    };
};

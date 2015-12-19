"use strict";

module.exports = (core, app) => {
    const Source = core.models.Source;
    const Artwork = core.models.Artwork;

    const cache = require("../server/middlewares/cache");

    return {
        index(req, res) {
            Artwork.count((err, total) => {
                res.render("home", {
                    sources: Source.getSources(),
                    total: total,
                });
            });
        },

        routes() {
            app.get("/", cache(1), this.index);
        },
    };
};

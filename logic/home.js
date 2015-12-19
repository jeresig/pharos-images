"use strict";

module.exports = (core) => {
    const Source = core.models.Source;
    const Artwork = core.models.Artwork;

    return {
        index(req, res) {
            Artwork.count((err, total) => {
                res.render("home", {
                    sources: Source.getSources(),
                    total: total,
                });
            });
        },
    };
};

"use strict";

module.exports = (core) => {
    const Source = core.models.Source;
    const Artwork = core.models.Artwork;

    return {
        index(req, res) {
            Artwork.count((err, total) => {
                res.render("home/index", {
                    title: req.i18n.__("Title"),
                    desc: req.i18n.__("Description"),
                    sources: Source.getSources(),
                    total: total,
                });
            });
        },
    };
};

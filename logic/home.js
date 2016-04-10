"use strict";

const async = require("async");

const cache = require("../server/middlewares/cache");

module.exports = (core, app) => {
    const Source = core.models.Source;
    const Artwork = core.models.Artwork;
    const Image = core.models.Image;

    return {
        index(req, res, next) {
            async.parallel([
                (callback) => Artwork.count({}, callback),
                (callback) => Image.count({}, callback),
            ], (err, results) => {
                /* istanbul ignore if */
                if (err) {
                    return next(err);
                }

                res.render("home", {
                    sources: Source.getSources(),
                    artworkTotal: results[0],
                    imageTotal: results[1],
                });
            });
        },

        routes() {
            app.get("/", cache(1), this.index);
        },
    };
};

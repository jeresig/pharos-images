"use strict";

const async = require("async");

const cache = require("../server/middlewares/cache");

const models = require("../lib/models");

module.exports = (app) => {
    const Source = models("Source");
    const Artwork = models("Artwork");
    const Image = models("Image");

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

                res.render("Home", {
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

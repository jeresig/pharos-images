"use strict";

const async = require("async");

module.exports = (core) => {
    const Era = core.db.model("Era");
    const Artwork = core.db.model("Artwork");
    const Artist = core.db.model("Artist");

    return {
        index(req, res) {
            Era.find({}, (err, eras) => {
                async.eachLimit(eras, 4, (era, callback) => {
                    Artist.find({eras: era._id, printCount: {$gte: 100}})
                        .sort("printCount")
                        .populate("repImage")
                        .exec((err, artists) => {
                            era.artists = artists;
                            callback();
                        });
                }, function() {
                    Artwork.count((err, total) => {
                        res.render("home/index", {
                            title: req.i18n.__("Japanese Woodblock Print Search"),
                            desc: req.i18n.__("Japanese Woodblock print search engine. Searches thousands of Ukiyo-e, Meiji, Shin Hanga, and Sosaku Hanga prints."),
                            eras: eras,
                            total: total
                        });
                    });
                });
            });
        },

        about(req, res) {
            res.render("home/about", {
                title: req.i18n.__("About The Site"),
                desc: req.i18n.__("About the design, construction, and creation of the Ukiyo-e.org site.")
            });
        }
    };
};
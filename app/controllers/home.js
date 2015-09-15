var async = require("async");

module.exports = function(ukiyoe) {

var Era = ukiyoe.db.model("Era");
var Artwork = ukiyoe.db.model("Artwork");
var Artist = ukiyoe.db.model("Artist");

var exports = {};

exports.index = function (req, res) {
    Era.find({}, function(err, eras) {
        async.eachLimit(eras, 4, function(era, callback) {
            Artist.find({eras: era._id, printCount: {$gte: 100}})
                .sort("printCount")
                .populate("repImage")
                .exec(function(err, artists) {
                    era.artists = artists;
                    callback();
                });
        }, function() {
            Artwork.count(function(err, total) {
                res.render("home/index", {
                    title: req.i18n.__("Japanese Woodblock Print Search"),
                    desc: req.i18n.__("Japanese Woodblock print search engine. Searches thousands of Ukiyo-e, Meiji, Shin Hanga, and Sosaku Hanga prints."),
                    eras: eras,
                    total: total
                });
            });
        });
    });
};

exports.about = function (req, res) {
    res.render("home/about", {
        title: req.i18n.__("About The Site"),
        desc: req.i18n.__("About the design, construction, and creation of the Ukiyo-e.org site.")
    });
};

return exports;
};
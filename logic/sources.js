var async = require("async");

module.exports = function(core, app) {

var Source = core.db.model("Source");

Source.prototype.getURL = function(locale) {
    return app.genURL(locale, "/source/" + this._id);
};

var sourceTypes = require("../data/source-types.json");

var sourceTypeMap = {};
var numColumns = 4;

sourceTypes.forEach(function(type) {
    // Create a mapping for the source types
    sourceTypeMap[type.type] = type.name;
});

var clusterSource = function(source, cluster) {
    source.types.forEach(function(type) {
        if (!cluster[type]) {
            cluster[type] = [[]];
        }

        // Get most recently created row
        curRow = cluster[type][ cluster[type].length - 1 ];

        if (curRow.length === numColumns) {
            curRow = [];
            cluster[type].push(curRow);
        }

        curRow.push(source);
    });
};

return {
    index: function(req, res) {
        Source.find({}, function(err, sources) {
            if (err) {
                return res.render("500");
            }

            var total = 0;
            var activeSources = {};

            async.eachLimit(sources, 2, function(source, callback) {
                source.getNumArtworks(function(err, count) {
                    source.numArtworks = count;
                    callback();
                });
            }, function() {
                sources.forEach(function(source) {
                    if (source.numArtworks > 0) {
                        total += source.numArtworks;
                        clusterSource(source, activeSources);
                    }
                });

                res.render("sources/index", {
                    title: req.i18n.__("Sources of Japanese Woodblock Prints"),
                    sourceTypes: sourceTypes,
                    sourceTypeMap: sourceTypeMap,
                    activeSources: activeSources,
                    total: total
                });
            });
        });
    },

    show: function(req, res) {
        app.imageSearch(req, res, {
            title: req.source.getFullName(req.i18n.getLocale()),
            desc: req.i18n.__("Japanese Woodblock prints at the %s.",
                req.source.getFullName(req.i18n.getLocale())),
            url: req.source.url
        });
    },

    load: function(req, res, next, id) {
        Source.findById(id, function(err, source) {
            if (err) {
                return next(err);
            }
            if (!source) {
                return next(new Error("not found"));
            }
            req.source = source;
            next();
        });
    }
};
};
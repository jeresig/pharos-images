"use strict";

const async = require("async");

module.exports = (core, app) => {
    const Source = core.db.model("Source");
    const search = require("./shared/search")(core, app);

    const sourceTypes = require("../data/source-types.json");

    const sourceTypeMap = {};
    const numColumns = 4;

    sourceTypes.forEach((type) => {
        // Create a mapping for the source types
        sourceTypeMap[type.type] = type.name;
    });

    const clusterSource = (source, cluster) => {
        source.types.forEach((type) => {
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
        index(req, res) {
            Source.find({}, function(err, sources) {
                if (err) {
                    return res.render("500");
                }

                const total = 0;
                const activeSources = {};

                async.eachLimit(sources, 2, (source, callback) => {
                    source.getNumArtworks((err, count) => {
                        source.numArtworks = count;
                        callback();
                    });
                }, function() {
                    sources.forEach((source) => {
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

        show(req, res) {
            search(req, res, {
                title: req.source.getFullName(req.i18n.getLocale()),
                desc: req.i18n.__("Japanese Woodblock prints at the %s.",
                    req.source.getFullName(req.i18n.getLocale())),
                url: req.source.url
            });
        },

        load(req, res, next, id) {
            Source.findById(id, (err, source) => {
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
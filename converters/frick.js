var async = require("async");
var csv = require("csv-streamify");

var yr = require("yearrange");
var pd = require("parse-dimensions");

module.exports = {
    propMap: {
        id: "Xinet_ID",
        title: "Title",
        dateCreateds: ["WORK DATE", function(date, data) {
            // WorkDate_earliestDate
            // WorkDate_latestDate
            // Qualifier
            return yr.parse(date || data["Creator_datesDisplay"]);
        }],
        // Category ?
        // Supplemental Categories
        categories: "WorkSubject_classSubj",
        objectType: "WorkMaterial_display",
        artists: {
            name: "Creator",
            dates: ["Creator_datesDisplay", function(date) {
                return yr.parse(date);
            }]
        },
        dimensions: ["MEASUREMENTS", function(dimension) {
            // WorkMeasurements_d
            // WorkMeasurements_h
            // WorkMeasurements_w
            // WorkMeasurements_unit
            if (dimension) {
                return pd.parseDimensions(dimension);
            } else {
                return [];
            }
        }],
        collections: {
            location: "WorkLocation_city",
            name: "WorkLocation_collection"
        },
        images: {
            id: "BibRecordNumberLong",
            fileName: ["Path", function(path) {
                return /([^\/]*)$/.exec(path.replace(/\.tif$/, ".jpg"))[0];
            }]
        }
    },

    searchByProps: function(row, propMap) {
        var results = {};

        for (var propName in propMap) {
            var searchValue = propMap[propName];

            if (typeof searchValue === "string") {
                var value = row[searchValue];
                if (value) {
                    results[propName] = value;
                }

            } else if (Array.isArray(searchValue)) {
                var value = row[searchValue[0]];
                results[propName] = searchValue[1](value, row);

            } else if (typeof searchValue === "object") {
                results[propName] = this.searchByProps(row, searchValue);
            }
        }

        return results;
    },

    cluster: function(rows, id, toCluster) {
        var map = {};

        return rows.map(function(row) {
            if (row[id] in map) {
                var base = map[row[id]];

                toCluster.forEach(function(clustered) {
                    if (Array.isArray(row[clustered])) {
                        base[clustered] = base[clustered].concat(
                            row[clustered]);
                    } else {
                        base[clustered].push(row[clustered]);
                    }
                });

            } else {
                map[row[id]] = row;

                toCluster.forEach(function(clustered) {
                    if (!Array.isArray(row[clustered])) {
                        row[clustered] = [row[clustered]];
                    }
                });

                return row;
            }
        }).filter(function(row) {
            return !!row;
        });
    },

    process: function(fileStream, addModel, done) {
        var results = [];

        fileStream
            .pipe(csv({
                objectMode: true,
                delimiter: "\t",
                columns: true
            }))
            .on("data", function(data) {
                var result = this.searchByProps(data, this.propMap);
                if (result.id) {
                    results.push(result);
                }
            }.bind(this))
            .on("end", function() {
                var filtered = this.cluster(results, "id", ["images"]);
                async.eachLimit(filtered, 1, addModel, done);
            }.bind(this));
    }
};
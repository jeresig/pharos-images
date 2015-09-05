var async = require("async");
var csv = require("csv-streamify");

var yr = require("yearrange");
var pd = require("parse-dimensions");

module.exports = {
    propMap: {
        id: "Xinet_ID",
        title: "Title",
        dateCreateds: ["WorkDate_earliestDate", function(earliest, data) {
            if (earliest) {
                return {
                    start: parseFloat(earliest),
                    end: parseFloat(data.WorkDate_latestDate),
                    circa: !!(data.Qualifier)
                };
            }

            return yr.parse(data.Creator_datesDisplay);
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
        dimensions: ["WorkMeasurements_display", function(measurement, data) {
            if (measurement) {
                return pd.parseDimension(measurement);
            }
        }],
        collections: {
            location: "WorkLocation_city",
            name: "WorkLocation_collection"
        },
        images: {
            id: "BibRecordNumberLong",
            fileName: ["Filename", function(fileName, data) {
                return fileName.replace(/\.tif$/, ".jpg");
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

    process: function(fileStreams, addModel, done) {
        var results = [];

        fileStreams[0]
            .pipe(csv({
                objectMode: true,
                delimiter: "\t",
                newline: "\r",
                columns: true
            }))
            .on("data", function(data) {
                var newData = {};

                for (var prop in data) {
                    var cleanProp = prop.replace(/\s*\*?$/, "");
                    newData[cleanProp] = data[prop].replace(/\\N/g, "");
                }

                var result = this.searchByProps(newData, this.propMap);
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
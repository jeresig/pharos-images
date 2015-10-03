var async = require("async");
var marc = require("marcjs");

var yr = require("yearrange");
var pd = require("parse-dimensions");

module.exports = {
    propMap: {
        id: ["001"],
        url: ["001", function(id) {
            return "http://library.nga.gov/imagecollections/mercury/" +
                "holdingsInfo?bibId=" + id;
        }],
        bibID: ["004"],
        title: ["245", ["a"]],
        dateCreateds: ["260", ["c"], function(results) {
            return yr.parse(results[0]);
        }],
        categories: ["650", ["a", "y", "z"], function(results) {
            return results.filter(function(name) {
                return !!name;
            }).join(", ");
        }],
        medium: ["300", ["a"]],
        artists: ["100", ["a", "d"], function(results) {
            var data = {
                name: results[0]
            };

            if (results[1]) {
                data.dates = yr.parse(results[1]);
            }

            return data;
        }],
        dimensions: ["300", ["c"], function(results) {
            // Flip the results, assume height is first
            return results[0] ?
                pd.parseDimensions(results[0], true) : undefined;
        }],
        collections: ["710", ["a"], function(results) {
            if (!results[0]) {
                return;
            }

            return {
                name: results[0]
            };
        }],
        images: ["856", ["u"], function(results) {
            var fileName = results[0].replace(/^.*\//, "");
            return {
                id: fileName.replace(/\.jpg$/, ""),
                fileName: fileName
            };
        }]
    },

    parseRecord: function(record) {
        record = record.toMiJ();

        var result = {};

        record.fields.forEach(function(item) {
            for (var id in item) {
                for (var name in this.propMap) {
                    var lookup = this.propMap[name];
                    var lookupNum = lookup[0];
                    var lookupFields = lookup[1];

                    if (id !== lookupNum) {
                        continue;
                    }

                    if (!item[id].subfields) {
                        result[name] = item[id];
                        continue;
                    }

                    var matches = [];
                    var subfields = item[id].subfields;

                    subfields.forEach(function(subfield) {
                        lookupFields.forEach(function(name) {
                            if (name in subfield) {
                                matches.push(subfield[name]);
                            }
                        });
                    });

                    if (lookup[2]) {
                        matches = lookup[2](matches);
                    }

                    if (Array.isArray(matches) && matches.length === 1) {
                        matches = matches[0];
                    }

                    if (!matches) {
                        break;
                    }

                    if (result[name]) {
                        if (Array.isArray(result[name])) {
                            result[name].push(matches);
                        } else {
                            result[name] = [result[name], matches];
                        }
                    } else {
                        result[name] = matches;
                    }
                }
            }
        }.bind(this));

        return result;
    },

    process: function(fileStreams, addModel, done) {
        var bibStream = fileStreams[0];
        var holdingStream = fileStreams[1];

        var bibs = {};
        var bibReader = new marc.getReader(bibStream, "iso2709");

        bibReader.on("data", function(record) {
            var result = this.parseRecord(record);
            result.images = [];
            bibs[result.id] = result;
        }.bind(this));

        bibReader.on("end", function() {
            var holdingReader = new marc.getReader(holdingStream, "iso2709");

            holdingReader.on("data", function(record) {
                var result = this.parseRecord(record);

                if (result.bibID in bibs) {
                    result.images.id = result.id;
                    bibs[result.bibID].images.push(result.images);
                }
            }.bind(this));

            holdingReader.on("end", function() {
                var entries = Object.keys(bibs).map(function(id) {
                    return bibs[id];
                });

                async.eachLimit(entries, 1, addModel, done);
            });
        }.bind(this));
    }
};
var marc = require("marcjs");

var yr = require("yearrange");
var pd = require("parse-dimensions");

modules.exports = {
    propMap: {
        id: ["001"],
        title: ["245", ["a"]],
        dateCreated: ["260", ["c"], function(results) {
            return yr.parse(results[0]);
        }],
        categories: ["650", ["a", "y", "z"], function(results) {
            return results.filter(function(name) {
                return !!name;
            }).join(", ");
        }],
        material: ["300", ["a"]],
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
            return results[0] ? pd.parseDimensions(results[0]) : undefined;
        }],
        collections: ["710", ["a"], function(results) {
            if (!results[0]) {
                return;
            }

            return {
                name: results[0]
            };
        }],
        images: ["856", ["u"]]
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

    process: function(fileStream, addModel, done) {
        var reader = new marc.getReader(fileStream, "iso2709");

        reader.on("data", function(record) {
            this.pause();

            var result = this.parseRecord(record);

            addModel(result, function() {
                console.log(model);
                this.resume();
            }.bind(this));
        });

        reader.on("end", done);
    }
};
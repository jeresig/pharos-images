var fs = require("fs");

var yr = require("yearrange");
var pd = require("parse-dimensions");
var marc = require("marcjs");
var mongoose = require("mongoose");

require("../models/ExtractedArtwork.js")();

var ExtractedArtwork = mongoose.model("ExtractedArtwork");

var propMap = {
    id: ["001"],
    title: ["245", ["a"]],
    dateCreated: ["260", ["c"], function(results) {
        return yr.parse(results[0]);
    }],
    categories: ["650", ["a", "y", "z"], function(results) {
        var data = {
            name: results[0]
        };

        if (results[1]) {
            data.place = results[1];
        }

        if (results[2]) {
            data.date = results[2];
        }

        return data;
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
};

var stream = fs.createReadStream(process.argv[2]);
var reader = new marc.getReader(stream, "iso2709");

reader.on("data", function(record) {
    record = record.toMiJ();
    //console.log(JSON.stringify(record, null, "    "));

    var result = {};

    record.fields.forEach(function(item) {
        for (var id in item) {
            for (var name in propMap) {
                var lookup = propMap[name];
                var lookupNum = lookup[0];
                var lookupFields = lookup[1];

                if (id === lookupNum) {
                    if (item[id].subfields) {
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
                    } else {
                        result[name] = item[id];
                    }
                }
            }
        }
    });

    var model = new ExtractedArtwork(result);
    console.log(model);
});

reader.on("end", function() {
    console.log("DONE");
    //process.exit(0);
});
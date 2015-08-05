var fs = require("fs");

var yr = require("yearrange");
var marc = require("marcjs");

var propMap = {
    id: ["001"],
    title: ["245", "a"],
    dateCreated: ["260", "c"],
    categories: ["650", "a", "y", "z"],
    material: ["300", "a"],
    artists: ["100", "a", "d"],
    dimensions: ["300", "c"],
    collections: ["710", "a"],
    images: ["856", "u"]
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
                var lookupFields = lookup.slice(1);

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

                        if (result[name]) {
                            result[name] = result[name].concat(matches);
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

    console.log(result);
});

reader.on("end", function() {
    console.log("DONE");
    //process.exit(0);
});
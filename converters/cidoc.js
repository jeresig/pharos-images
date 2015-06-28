var fs = require("fs");

var jsonld = require("jsonld");

var nquads = fs.readFileSync(process.argv[2], "utf8");

jsonld.fromRDF(nquads, {format: "application/nquads"}, function(err, records) {
    var record = records[1];
    var map = {};

    record["@graph"].forEach(function(item) {
        map[item["@id"]] = item;
    });

    var baseRecord = record["@graph"][0];

    for (var key in baseRecord) {
        var val = baseRecord[key];
        if (typeof val === "object") {
            baseRecord[key] = val.map(function(obj) {
                if (typeof obj === "object" && obj["@id"] in map) {
                    return map[obj["@id"]];
                }

                return obj;
            });
        }
    }

    //console.log(records.length)
    console.log(JSON.stringify(baseRecord, null, "    "));
});

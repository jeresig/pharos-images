var fs = require("fs");

var jsonld = require("jsonld");

var nquads = fs.readFileSync(process.argv[2], "utf8");

var cidocPrefix = "http://erlangen-crm.org/current/";

jsonld.fromRDF(nquads, {format: "application/nquads"}, function(err, records) {
    var record = records[1];
    var map = {};

    record["@graph"].forEach(function(item) {
        map[item["@id"]] = item;
    });

    var linkUpRecord = function(baseRecord) {
        delete baseRecord["@id"];

        //console.log(baseRecord)
        for (var key in baseRecord) {
            var val = baseRecord[key];

            if (key.indexOf(cidocPrefix) === 0) {
                delete baseRecord[key];
                key = key.replace(cidocPrefix, "");
                baseRecord[key] = val;
            }

            if (typeof val === "object") {
                baseRecord[key] = val.map(function(obj) {
                    if (typeof obj === "object") {
                        if ("@value" in obj) {
                            return obj["@value"];

                        } else if (obj["@id"] in map && map[obj["@id"]] !== obj) {
                            console.log("linking", obj["@id"])
                            if (obj["@id"] !== "http://collection.britishmuseum.org/id/object/JCF345") {
                                return map[obj["@id"]];
                            }
                        }
                    } else if (typeof obj === "string") {
                        return obj.replace(cidocPrefix, "");
                    }

                    return obj;
                });

                if (baseRecord[key].length === 1) {
                    baseRecord[key] = baseRecord[key][0];
                }
            }
        }

        return baseRecord;
    };

    for (var itemName in map) {
        linkUpRecord(map[itemName]);
    }

    var baseRecord = record["@graph"][0];

    //console.log(records.length)
    console.log(JSON.stringify(baseRecord, null, "    "));
});

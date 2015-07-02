var fs = require("fs");
var path = require("path");

var jsonld = require("jsonld");

var nquads = fs.readFileSync(process.argv[2], "utf8");

var cidocPrefix = "http://erlangen-crm.org/current/";

var processRecord = function(record) {
    var baseRecord = record["@graph"][0];
    var rootID = baseRecord["@id"];
    var map = {};

    record["@graph"].forEach(function(item) {
        map[item["@id"]] = item;
    });

    var linkUpRecord = function(baseRecord, rootID) {
        delete baseRecord["@id"];

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
                            if (obj["@id"] !== rootID) {
                                return map[obj["@id"]];
                            }
                        }
                    } else if (typeof obj === "string") {
                        return obj.replace(cidocPrefix, "");
                    }

                    return obj;
                });

                //if (baseRecord[key].length === 1) {
                //    baseRecord[key] = baseRecord[key][0];
                //}
            }
        }

        return baseRecord;
    };

    for (var itemName in map) {
        linkUpRecord(map[itemName], rootID);
    }

    return baseRecord;
}

jsonld.fromRDF(nquads, {format: "application/nquads"}, function(err, records) {
    var results = records.slice(1).map(processRecord);
    console.log(JSON.stringify(results, null, "     "));
});

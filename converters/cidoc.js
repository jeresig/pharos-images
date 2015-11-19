"use strict";

const fs = require("fs");

const jsonld = require("jsonld");

const nquads = fs.readFileSync(process.argv[2], "utf8");

const cidocPrefix = "http://erlangen-crm.org/current/";

const processRecord = (record) => {
    const baseRecord = record["@graph"][0];
    const rootID = baseRecord["@id"];
    const map = {};

    record["@graph"].forEach((item) => {
        map[item["@id"]] = item;
    });

    const linkUpRecord = (baseRecord, rootID) => {
        delete baseRecord["@id"];

        for (let key in baseRecord) {
            const val = baseRecord[key];

            if (key.indexOf(cidocPrefix) === 0) {
                delete baseRecord[key];
                key = key.replace(cidocPrefix, "");
                baseRecord[key] = val;
            }

            if (typeof val === "object") {
                baseRecord[key] = val.map((obj) => {
                    if (typeof obj === "object") {
                        if ("@value" in obj) {
                            return obj["@value"];

                        } else if (obj["@id"] in map &&
                                map[obj["@id"]] !== obj) {
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

    for (const itemName in map) {
        linkUpRecord(map[itemName], rootID);
    }

    return baseRecord;
};

jsonld.fromRDF(nquads, {format: "application/nquads"}, (err, records) => {
    const results = records.slice(1).map(processRecord);
    console.log(JSON.stringify(results, null, "     "));
});

"use strict";

const marc = require("marcjs");

const trim = (str) => (str || "").replace(/[.,]$/, "");

const types = {
    "Painting": "painting",
    "Frescoes": "fresco",
    "Drawing": "drawing",
    "Drawings": "drawing",
    "Sculpture": "sculpture",
    "Decorative arts": "decorative arts",
    "Medals": "medal",
    "Prints": "print",
    "Photography": "photo",
};

const defaultType = "painting";

const propMap = {
    id: ["001"],
    url: [
        "001",
        (id) => `http://library.nga.gov/imagecollections/mercury/` +
            `holdingsInfo?bibId=${id}`,
    ],
    bibID: ["004"],
    title: ["245", ["a"], (results) => trim(results[0])],
    dates: ["260", ["c"], (results) => [trim(results[0])]],
    categories: [
        "650",
        ["a", "x", "y", "z"],
        (results) => results.filter((name) => !!name).map(trim).join(", "),
        (val, result) => {
            if (result.depictions) {
                val = val.concat(result.depictions);
                delete result.depictions;
            }

            return val;
        },
    ],
    /*
    depictions: [
        "600",
        ["a", "c"],
        (results) => results.filter((name) => !!name).map(trim).join(", "),
    ],
    */
    medium: ["300", ["a"], (results) => trim(results[0])],
    objectType: [
        "650",
        ["a", "y", "z"],
        (results) => results[1] && results[2] ? trim(results[0]) : "",
        (val) => {
            if (!val) {
                return;
            }

            val = Array.isArray(val) ? val : [val];
            let ret;

            for (let i = 0; i < val.length; i += 1) {
                if (types[val[i]]) {
                    ret = types[val[i]];
                }
            }

            if (!ret) {
                ret = defaultType;
            }

            return ret;
        },
    ],
    artists: [
        "100",
        ["a", "d"],
        (results) => {
            const data = {
                name: trim(results[0]),
            };

            if (results[1]) {
                data.dates = trim(results[1]);
            }

            return [data];
        },
    ],
    dimensions: [
        "300",
        ["c"],
        (results) => (results[0] && [trim(results[0])]),
    ],
    locations: [
        "710",
        ["a"],
        (results) => (results[0] && [{name: trim(results[0])}]),
    ],
    images: [
        "856",
        ["u"],
        (results) => results[0].replace(/^.*[/]/, ""),
    ],
};

const parseRecord = function(record) {
    record = record.toMiJ();

    const result = {};

    record.fields.forEach((item) => {
        for (const id in item) {
            for (const name in propMap) {
                const lookup = propMap[name];
                const lookupNum = lookup[0];
                const lookupFields = lookup[1];

                if (id !== lookupNum) {
                    continue;
                }

                if (!item[id].subfields) {
                    result[name] = item[id];
                    if (lookup[1]) {
                        result[name] = lookup[1](result[name]);
                    }
                    continue;
                }

                let matches = [];
                const subfields = item[id].subfields;

                subfields.forEach((subfield) => {
                    lookupFields.forEach((name) => {
                        if (name in subfield) {
                            matches.push(subfield[name]);
                        }
                    });
                });

                if (lookup[2]) {
                    matches = lookup[2](matches);
                }

                //if (Array.isArray(matches) && matches.length === 1) {
                //    matches = matches[0];
                //}

                if (!matches) {
                    break;
                }

                if (result[name]) {
                    if (!Array.isArray(result[name])) {
                        result[name] = [result[name]];
                    }

                    if (Array.isArray(matches)) {
                        result[name] = result[name].concat(matches);
                    } else {
                        result[name].push(matches);
                    }
                } else {
                    result[name] = matches;
                }
            }
        }
    });

    for (const name in propMap) {
        const lookup = propMap[name];

        if (lookup[3]) {
            result[name] = lookup[3](result[name], result);
        }
    }

    return result;
};

module.exports = function(fileStreams, callback) {
    const bibStream = fileStreams[0];
    const holdingStream = fileStreams[1];

    const bibs = {};
    const bibReader = new marc.getReader(bibStream, "iso2709");

    bibReader.on("data", (record) => {
        const result = parseRecord(record);
        result.lang = "en";
        result.images = [];
        bibs[result.id] = result;
    });

    bibReader.on("error", callback);

    bibReader.on("end", () => {
        const holdingReader = new marc.getReader(holdingStream, "iso2709");

        holdingReader.on("data", (record) => {
            const result = parseRecord(record);

            if (result.bibID in bibs) {
                bibs[result.bibID].images.push(result.images);
            }
        });

        holdingReader.on("end", () => {
            callback(null, Object.keys(bibs).map((id) => bibs[id]));
        });
    });
};

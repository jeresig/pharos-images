"use strict";

const iconv = require("iconv-lite");
const csv = require("csv-streamify");

const types = {
    "#N/A": undefined,
    "0": undefined,
    "detached fresco": "fresco",
    "detached mosaic": "mosaic",
};

const propMap = {
    id: "bibRecordNumberLong",
    url: [
        "bibRecordNumberLong",
        (id) => {
            // The ID is actually missing the last number
            // (although it's not always a number!)
            id = id.replace(/^(b\d{7}).*$/, (all, match) => match);

            return `http://arcade.nyarc.org/record=${id}~S7`;
        },
    ],
    title: "Title",
    dates: [
        "WorkDate_earliestDate",
        (earliest, data) => {
            if (earliest && data.WorkDate_latestDate) {
                return [{
                    start: parseFloat(earliest),
                    end: parseFloat(data.WorkDate_latestDate),
                    circa: !!(data.Qualifier),
                }];

            } else if (data.WorkDate_display) {
                return [data.WorkDate_display];
            } else if (data.Creator_datesDisplay) {
                return [data.Creator_datesDisplay];
            }

            return [];
        },
    ],
    categories: ["WorkSubject_classSubj", (subject) => {
        return subject ? [subject] : [];
    }],
    medium: "WorkMaterial_display",
    objectType: [
        "WorkTechnique",
        (type) => (type in types ? types[type] : type),
    ],
    artists: ["Creator", (name) => {
        return name ? [{name}] : [];
    }],
    dimensions: [
        "WorkMeasurements_display",
        (measurement, data) => {
            return measurement ? [measurement] : [];
        },
    ],
    locations: ["Collection", (name, data) => {
        const city = data.WorkLocation_city;
        if (name || city) {
            const data = {};
            if (name) {
                data.name = name;
            }
            if (city) {
                data.city = city;
            }
            return [data];
        }
        return [];
    }],
    images: ["FullPath", (fileName) => fileName.replace(/^.*[/]/, "")
        .replace(/\.tif$/, ".jpg")],
};

const searchByProps = function(row, propMap) {
    const results = {};

    for (const propName in propMap) {
        const searchValue = propMap[propName];

        if (typeof searchValue === "string") {
            const value = row[searchValue];
            if (value) {
                results[propName] = value;
            }

        } else if (Array.isArray(searchValue)) {
            const value = row[searchValue[0]];
            results[propName] = searchValue[1](value, row);

        } else if (typeof searchValue === "object") {
            results[propName] = searchByProps(row, searchValue);
        }
    }

    return results;
};

const cluster = function(rows, id, toCluster) {
    const map = {};

    return rows.map((row) => {
        if (row[id] in map) {
            const base = map[row[id]];

            toCluster.forEach((clustered) => {
                if (Array.isArray(row[clustered])) {
                    base[clustered] = base[clustered].concat(
                        row[clustered]);
                } else {
                    base[clustered].push(row[clustered]);
                }
            });

        } else {
            map[row[id]] = row;

            toCluster.forEach((clustered) => {
                if (!Array.isArray(row[clustered])) {
                    row[clustered] = [row[clustered]];
                }
            });

            return row;
        }
    }).filter((row) => !!row);
};

module.exports = {
    files: [
        "A tab-separated values file (.tsv).",
    ],

    processFiles(fileStreams, callback) {
        const results = [];

        fileStreams[0]
            .pipe(iconv.decodeStream("macintosh"))
            .pipe(iconv.encodeStream("utf8"))
            .pipe(csv({
                objectMode: true,
                delimiter: "\t",
                newline: "\n",
                columns: true,
            }))
            .on("data", (data) => {
                if (data.bibRecordNumberLong) {
                    const result = searchByProps(data, propMap);
                    if (result.id) {
                        result.lang = "en";
                        results.push(result);
                    }
                }
            })
            .on("error", callback)
            .on("end", () => {
                callback(null, cluster(results, "id", ["images"]));
            });
    },
};

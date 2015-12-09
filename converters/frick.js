"use strict";

const async = require("async");
const csv = require("csv-streamify");

const yr = require("yearrange");
const pd = require("parse-dimensions");

module.exports = {
    propMap: {
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
        dateCreateds: [
            "WorkDate_earliestDate",
            (earliest, data) => {
                if (earliest || data.WorkDate_latestDate) {
                    return {
                        start: parseFloat(earliest),
                        end: parseFloat(data.WorkDate_latestDate),
                        circa: !!(data.Qualifier),
                    };

                } else if (data.WorkDate_display) {
                    return yr.parse(data.WorkDate_display);
                }

                return yr.parse(data.Creator_datesDisplay);
            },
        ],
        categories: "WorkSubject_classSubj",
        medium: "WorkTechnique",
        objectType: "WorkMaterial_display",
        artists: {
            name: "Creator",
            dates: ["Creator_datesDisplay", (date) => yr.parse(date)],
        },
        dimensions: [
            "WorkMeasurements_display",
            (measurement, data) => {
                if (measurement) {
                    return pd.parseDimension(measurement, true);
                }
            },
        ],
        collections: {
            city: "WorkLocation_city",
            name: "Collection",
        },
        images: {
            id: "ImageID",
            fileName: ["FullPath",
                (fileName, data) => fileName.replace(/^.*[/]/, "")
                    .replace(/\.tif$/, ".jpg")],
        },
    },

    searchByProps(row, propMap) {
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
                results[propName] = this.searchByProps(row, searchValue);
            }
        }

        return results;
    },

    cluster(rows, id, toCluster) {
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
    },

    process(fileStreams, addModel, done) {
        const results = [];

        fileStreams[0]
            .pipe(csv({
                objectMode: true,
                delimiter: "\t",
                newline: "\r",
                columns: true,
            }))
            .on("data", (data) => {
                const newData = {};

                for (const prop in data) {
                    const cleanProp = prop.replace(/\s*\*?$/, "");
                    newData[cleanProp] = data[prop].replace(/\\N/g, "");
                }

                const result = this.searchByProps(newData, this.propMap);
                if (result.id) {
                    results.push(result);
                }
            })
            .on("end", () => {
                const filtered = this.cluster(results, "id", ["images"]);
                async.eachLimit(filtered, 1, addModel, done);
            });
    },
};

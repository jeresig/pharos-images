"use strict";

const async = require("async");
const marc = require("marcjs");

const yr = require("yearrange");
const pd = require("parse-dimensions");

module.exports = {
    propMap: {
        id: ["001"],
        url: [
            "001",
            (id) => `http://library.nga.gov/imagecollections/mercury/` +
                `holdingsInfo?bibId=${id}`,
        ],
        bibID: ["004"],
        title: ["245", ["a"]],
        dateCreateds: ["260", ["c"], (results) => yr.parse(results[0])],
        categories: [
            "650",
            ["a", "y", "z"],
            (results) => results.filter((name) => !!name).join(", "),
        ],
        medium: ["300", ["a"]],
        artists: [
            "100",
            ["a", "d"],
            (results) => {
                const data = {
                    name: results[0],
                };

                if (results[1]) {
                    data.dates = yr.parse(results[1]);
                }

                return data;
            },
        ],
        dimensions: [
            "300",
            ["c"],
            // Flip the results, assume height is first
            (results) => (results[0] &&
                pd.parseDimensions(results[0], true)),
        ],
        collections: [
            "710",
            ["a"],
            (results) => (results[0] && {name: results[0]}),
        ],
        images: [
            "856",
            ["u"],
            (results) => {
                const fileName = results[0].replace(/^.*\//, "");
                return {
                    id: fileName.replace(/\.jpg$/, ""),
                    fileName: fileName,
                };
            },
        ],
    },

    parseRecord(record) {
        record = record.toMiJ();

        const result = {};

        record.fields.forEach((item) => {
            for (const id in item) {
                for (const name in this.propMap) {
                    const lookup = this.propMap[name];
                    const lookupNum = lookup[0];
                    const lookupFields = lookup[1];

                    if (id !== lookupNum) {
                        continue;
                    }

                    if (!item[id].subfields) {
                        result[name] = item[id];
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
        });

        return result;
    },

    process(fileStreams, addModel, done) {
        const bibStream = fileStreams[0];
        const holdingStream = fileStreams[1];

        const bibs = {};
        const bibReader = new marc.getReader(bibStream, "iso2709");

        bibReader.on("data", (record) => {
            const result = this.parseRecord(record);
            result.images = [];
            bibs[result.id] = result;
        });

        bibReader.on("end", () => {
            const holdingReader = new marc.getReader(holdingStream, "iso2709");

            holdingReader.on("data", (record) => {
                const result = this.parseRecord(record);

                if (result.bibID in bibs) {
                    result.images.id = result.id;
                    bibs[result.bibID].images.push(result.images);
                }
            });

            holdingReader.on("end", () => {
                const entries = Object.keys(bibs).map((id) => bibs[id]);

                async.eachLimit(entries, 1, addModel, done);
            });
        });
    },
};

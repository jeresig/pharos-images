"use strict";

const concat = require("concat-stream");
const libxmljs = require("libxmljs");

const types = {
    "Gemälde": "painting",
    "Malerei": "painting",
    "Malerei?": "painting",
    "Zeichenkunst": "drawing",
    "Angewandte Kunst": "decorative arts",
    "Skulptur": "sculpture",
    "Architektur": "architecture",
    "Altar": "sculpture",
};

const propMap = {
    id: ["recordInfoLink", (id) => id.replace(/^.*[/]obj/, "")],
    url: "recordInfoLink",
    title: "titleSet/appellationValue[@pref='preferred']",
    objectType: [
        "classification[@type='Gattung']/term[@addedSearchTerm='yes']",
        (val, getByTagName) => {
            const result = val || getByTagName("classification/term") ||
                getByTagName("objectWorkType/term[@addedSearchTerm='yes']") ||
                getByTagName("objectWorkType/term");
            // Return undefined for types that aren't found
            return types[result];
        },
    ],
    dates: {
        every: "eventDate/displayDate",
        data: (value) => value.replace(/^um /, "ca "),
    },
    // NOTE(jeresig): There are multiple mediums represented, we don't have a
    // good way to combine them.
    medium: "termMaterialsTech//term",
    dimensions: {
        every: "measurementsSet",
        data: (value, getByTagName) => {
            return (getByTagName("measurementValue") +
                getByTagName("measurementUnit")).replace(/,/g, ".");
        },
    },
    locations: {
        every: "repositorySet",
        data: (val, getByTagName) => {
            const city = getByTagName(
                "repositoryLocation/namePlaceSet/appellationValue");
            const name = getByTagName(
                "repositoryName/legalBodyName/appellationValue") || city;
            const country = getByTagName(
                "partOfPlace[@politicalEntity='Staat']//appellationValue");
            if (name || city || country) {
                return {name, city, country};
            }
        },
    },
    artists: {
        every: "actorInRole/actor[@type='person']",
        data: (val, getByTagName) => {
            const name = getByTagName(
                "nameActorSet/appellationValue[@pref='preferred']") ||
                getByTagName("nameActorSet/appellationValue");
            const pseudonym = getByTagName(
                "nameActorSet/appellationValue[@pref='alternative']");
            const startDate = getByTagName("vitalDatesActor/earliestDate");
            const endDate = getByTagName("vitalDatesActor/latestDate");
            let date;
            if (startDate || endDate) {
                date = {
                    start: parseFloat(startDate) || undefined,
                    end: parseFloat(endDate) || undefined,
                };
            }
            if (name) {
                return {
                    name,
                    pseudonym,
                    date,
                };
            }
        },
    },
    images: {
        every: "resourceRepresentation[@type='image_full']/linkResource",
        data: (val) => `${val.replace(/^.*[/]/, "")}.jpg`,
    },
    categories: {
        every: "subjectConcept/term[@pref='preferred']",
        data: (val) => val,
    },
};

const searchByProps = function(root, propMap) {
    const results = {};

    const getByTagName = (name) => {
        const node = root.get(`.//${name}`);
        if (node) {
            return (node.value ?
                node.value() :
                node.text());
        }
    };

    if (typeof propMap === "function") {
        return propMap(root.text(), getByTagName);
    }

    for (const propName in propMap) {
        let searchValue = propMap[propName];
        const hasFilter = Array.isArray(searchValue);

        if (hasFilter) {
            searchValue = searchValue[0];
        }

        if (typeof searchValue === "string") {
            if (searchValue === ".") {
                results[propName] = root.text();

            } else {
                results[propName] = getByTagName(searchValue);
            }

            if (hasFilter) {
                results[propName] =
                    propMap[propName][1](results[propName], getByTagName);
            }

        } else if (typeof searchValue === "object") {
            if (searchValue.every) {
                const matches = root.find(`.//${searchValue.every}`);
                results[propName] = matches.map(
                    (node) => searchByProps(node, searchValue.data))
                    .filter((val) => !!val);
            } else {
                results[propName] = searchByProps(root, searchValue);
            }
        }
    }

    return results;
};

const combine = (root, match, props) => {
    props.forEach((name) => {
        root[name] = root[name].concat(match[name]);
    });
};

module.exports = {
    files: [
        "A LIDO-formatted XML file.",
    ],

    processFiles(fileStreams, callback) {
        const byId = {};

        fileStreams[0].pipe(concat((fileData) => {
            try {
                const xmlDoc = libxmljs.parseXml(
                    fileData.toString("utf8").replace(/lido:/g, ""));
                const matches = xmlDoc.find("//lido")
                    .map((node) => searchByProps(node, propMap));

                matches.forEach((match) => {
                    if (match.id in byId) {
                        if (match.images.length > 0) {
                            combine(byId[match.id], match,
                                ["images", "dimensions", "categories"]);
                        }
                    } else {
                        Object.assign(match, {lang: "de"});
                        byId[match.id] = match;
                    }
                });

                const results = Object.keys(byId)
                    .map((id) => byId[id])
                    .filter((match) => match.images.length > 0);
                callback(null, results);
            } catch (e) {
                callback(e);
            }
        }));
    },
};

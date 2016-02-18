"use strict";

const concat = require("concat-stream");
const libxmljs = require("libxmljs");

const types = {
    "Gemälde": "painting",
    "grafica": "print",
    "mosaico": "mosaic",
    "scultura/ arti applicate": "decorative arts",
    "arti applicate": "decorative arts",
    "scultura": "sculpture",
    "dipinto/ scultura": "painting",
    "disegno": "drawing",
};

const propMap = {
    id: ["lidoRecID", (id) => id.replace(/^.*[/]/, "")],
    url: "recordInfoLink",
    title: "titleSet/appellationValue[@pref='preferred']",
    // TODO: Find a better version of this
    objectType: ["objectWorkType/term", (val) => types[val] || val],
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
            return getByTagName("measurementValue") +
                getByTagName("measurementUnit");
        },
    },
    locations: {
        every: "repositorySet",
        data: {
            // TODO: Use "City" value for name if no name exists
            name: "repositoryName/legalBodyName/appellationValue",
            city: "repositoryLocation/namePlaceSet/appellationValue",
            country: "partOfPlace[@politicalEntity='Staat']//appellationValue",
        },
    },
    artists: {
        every: "actorInRole",
        data: {
            name: "nameActorSet/appellationValue[@pref='preferred']",
        },
    },
    images: {
        every: "resourceRepresentation[@type='image_full']/linkResource",
        data: (val) => `${val.replace(/^.*[/]/, "")}.jpg`,
    },
    categories: {
        every: "subjectConcept/term[@pref='preferred']",
        // TODO: Delete empty values
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
                    (node) => searchByProps(node, searchValue.data));
            } else {
                results[propName] = searchByProps(root, searchValue);
            }
        }
    }

    return results;
};

module.exports = {
    files: [
        "A LIDO-formatted XML file.",
    ],

    processFiles(fileStreams, callback) {
        fileStreams[0].pipe(concat((fileData) => {
            try {
                const xmlDoc = libxmljs.parseXml(
                    fileData.toString("utf8").replace(/lido:/g, ""));
                const matches = xmlDoc.find("//lido")
                    .map((node) => searchByProps(node, propMap))
                    .map((match) => {
                        match.lang = "de";
                        return match;
                    });
                callback(null, matches);
            } catch (e) {
                callback(e);
            }
        }));
    },
};

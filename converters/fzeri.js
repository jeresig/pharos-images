"use strict";

const async = require("async");
const concat = require("concat-stream");
const libxmljs = require("libxmljs");

const pd = require("parse-dimensions");

const types = {
    "dipinto": "painting",
    "grafica": "print",
    "mosaico": "mosaic",
    "scultura/ arti applicate": "decorative arts",
    "arti applicate": "decorative arts",
    "scultura": "sculpture",
    "dipinto/ scultura": "painting",
    "disegno": "drawing",
};

module.exports = {
    propMap: {
        id: "SERCD",
        url: [
            "SERCD",
            (val) => `http://catalogo.fondazionezeri.unibo.it/scheda.jsp?` +
                `decorator=layout_S2&apply=true&tipo_scheda=OA&id=${val}`,
        ],
        title: "SGTI",
        dateCreateds: {
            label: "DTZG",
            start: ["DTSI", (val) => parseFloat(val)],
            end: ["DTSF", (val) => parseFloat(val)],
            circa: [
                "DTSV",
                (val, getByTagName) => (val || getByTagName("DTSL")),
            ],
        },
        medium: "MTC",
        objectType: [
            "OGTT",
            (val, getByTagName) => {
                val = types[val] || val;
                // Special-case frescos
                if (val === "painting" &&
                        /affresco/i.test(getByTagName("MTC"))) {
                    val = "fresco";
                }
                return val;
            },
        ],
        dimensions: [
            "MISU",
            (unit, getByTagName) => {
                if (unit) {
                    return pd.parseDimensions(
                        `${getByTagName("MISL")}${unit} x ` +
                        `${getByTagName("MISA")}${unit}`
                    );
                }
            },
        ],
        locations: {
            name: "LDCN",
            country: "PVCS",
            city: "PVCC",
        },
        artists: {
            every: "PARAGRAFO[@etichetta='AUTHOR']/RIPETIZIONE",
            data: {
                name: "AUTN",
                pseudonym: "AUTP",
            },
        },
        images: {
            every: "FOTO",
            data: (val) => val.replace(/^.*[/]/, ""),
        },
    },

    searchByProps(root, propMap) {
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
            return propMap(root.text());
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
                        (node) => this.searchByProps(node, searchValue.data));
                } else {
                    results[propName] = this.searchByProps(root, searchValue);
                }
            }
        }

        return results;
    },

    process(fileStreams, addModel, done) {
        fileStreams[0].pipe(concat((fileData) => {
            const xmlDoc = libxmljs.parseXml(fileData.toString("utf8"));
            const matches = xmlDoc.find("//SCHEDA");

            async.eachLimit(matches, 4, (node, callback) => {
                const result = this.searchByProps(node, this.propMap);
                addModel(result, callback);
            }, done);
        }));
    },
};

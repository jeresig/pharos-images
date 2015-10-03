var async = require("async");
var concat = require("concat-stream");
var libxmljs = require("libxmljs");

var pd = require("parse-dimensions");

module.exports = {
    propMap: {
        id: "SERCD",
        url: ["SERCD", function(val) {
            return "http://catalogo.fondazionezeri.unibo.it/scheda.jsp?" +
                "decorator=layout_S2&apply=true&tipo_scheda=OA&id=" + val;
        }],
        title: "SGTI",
        dateCreateds: {
            label: "DTZG",
            start: ["DTSI", function(val) {
                return parseFloat(val);
            }],
            end: ["DTSF", function(val) {
                return parseFloat(val);
            }],
            circa: ["DTSV", function(val, getByTagName) {
                return val || getByTagName("DTSL");
            }]
        },
        medium: "MTC",
        objectType: "OGTT",
        dimensions: ["MISU", function(unit, getByTagName) {
            if (unit) {
                return pd.parseDimensions(
                    getByTagName("MISL") + unit + " x " +
                    getByTagName("MISA") + unit
                );
            }
        }],
        collections: {
            name: "LDCN",
            country: "PVCS",
            city: "PVCC"
        },
        artists: {
            every: "PARAGRAFO[@etichetta='AUTHOR']/RIPETIZIONE",
            data: {
                name: "AUTN",
                pseudonym: "AUTP"
            }
        },
        images: {
            every: "FOTO",
            data: {
                id: "@sercdf",
                fileName: [".", function(val) {
                    return val.replace(/^.*\//, "");
                }]
            }
        }
    },

    searchByProps: function(root, propMap) {
        var results = {};

        var getByTagName = function(name) {
            var node = root.get(".//" + name);
            if (node) {
                return (node.value ?
                    node.value() :
                    node.text());
            }
        };

        for (var propName in propMap) {
            var searchValue = propMap[propName];
            var hasFilter = Array.isArray(searchValue);

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
                    var matches = root.find(".//" + searchValue.every);
                    results[propName] = matches.map(function(node) {
                        return this.searchByProps(node, searchValue.data);
                    }.bind(this));
                } else {
                    results[propName] = this.searchByProps(root, searchValue);
                }
            }
        }

        return results;
    },

    process: function(fileStreams, addModel, done) {
        fileStreams[0].pipe(concat(function(fileData) {
            var xmlDoc = libxmljs.parseXml(fileData.toString("utf8"));
            var matches = xmlDoc.find("//SCHEDA");

            async.eachLimit(matches, 4, function(node, callback) {
                var result = this.searchByProps(node, this.propMap);
                addModel(result, callback);
            }.bind(this), done);
        }.bind(this)));
    }
};
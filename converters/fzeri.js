var async = require("async");
var concat = require("concat-stream");
var libxmljs = require("libxmljs");

module.exports = {
    propMap: {
        id: "SERCD",
        title: "SGTI",
        dateCreateds: {
            label: "DTZG",
            start: "DTSI",
            end: "DTSF",
            circa: "DTSV" // "DTSL"
        },
        medium: "MTC",
        objectType: "OGTT",
        dimensions: {
            height: "MISA",
            width: "MISL",
            unit: "MISU"
        },
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
                path: "."
            }
        }
    },

    searchByProps: function(root, propMap) {
        var results = {};

        for (var propName in propMap) {
            var searchValue = propMap[propName];

            if (typeof searchValue === "string") {
                if (searchValue === ".") {
                    results[propName] = root.text();

                } else {
                    var node = root.get(".//" + searchValue);
                    if (node) {
                        results[propName] = (node.value ?
                            node.value() :
                            node.text());
                    }
                }
            } else if (typeof searchValue === "object") {
                if (searchValue.every) {
                    var matches = root.find(".//" + searchValue.every);
                    results[propName] = matches.map(function(node) {
                        return searchByProps(node, searchValue.data);
                    });
                } else {
                    results[propName] = searchByProps(root, searchValue);
                }
            }
        }

        return results;
    },

    process: function(fileStream, addModel, done) {
        fileStream.pipe(concat(function(fileData) {
            var xmlDoc = libxmljs.parseXml(fileData.toString("utf8"));
            var matches = xmlDoc.find("//SCHEDA");

            async.eachLimit(matches, 4, function(node, callback) {
                var result = this.searchByProps(node, this.propMap);
                addModel(result, callback);
            }.bind(this), done);
        }));
    }
};
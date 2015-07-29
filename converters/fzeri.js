/*
 * ID (SERCD)
 * Title/Subject (SGTI)
 * Date (DTSI - from, DTSF - to, DTSV/DTSL - approximation)
 * Category ?
 * Medium/Material (MTC)
 * Object Type (OGTT)
 * Dimensions (MISA - height, MISL - width, MISU - unit)
 * Collection (LDCN)
 * Collection Location (PVCS + PVCC)
 * For each RIPETIZIONE:
 * Artist (AUTN + AUTP for pseudonym)
 * Artist Dates/School?
 */

/*
 * ID (FOTO/@sercdf)
 * Image Path (FOTO)
 */
var mongoose = require("mongoose");

require("../models/ExtractedArtwork.js")();

var ExtractedArtwork = mongoose.model("ExtractedArtwork");

var fs = require("fs");
var libxmljs = require("libxmljs");

var file = process.argv[2];

var xmlDoc = libxmljs.parseXml(fs.readFileSync(file, "utf8"));

var propMap = {
    id: "SERCD",
    title: "SGTI",
    dateCreateds: {
        label: "DTZG",
        from: "DTSI",
        to: "DTSF",
        fromCirca: "DTSV",
        toCirca: "DTSL"
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
};

var searchByProps = function(root, propMap) {
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
};

xmlDoc.find("//SCHEDA").forEach(function(node) {
    var result = searchByProps(node, propMap);
    result._id = "fzeri/" + result.id;
    result.lang = "en";
    result.source = "fzeri";
    var model = new ExtractedArtwork(result);
    console.log(model);
});
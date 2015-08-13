var fs = require("fs");
var libxmljs = require("libxmljs");
var mongoose = require("mongoose");
var async = require("async");

// Load in configuration options
require("dotenv").load();

require("../models/ExtractedArtwork.js")();

var ExtractedArtwork = mongoose.model("ExtractedArtwork");

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

var file = process.argv[2];
var xmlDoc = libxmljs.parseXml(fs.readFileSync(file, "utf8"));

var propMap = {
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

var loadData = function(results) {
    mongoose.connect(process.env.MONGODB_URL);

    mongoose.connection.on("error", function(err) {
        console.error("Connection Error:", err)
    });

    mongoose.connection.once("open", function() {
        var matches = xmlDoc.find("//SCHEDA");

        async.eachLimit(matches, 4, function(node, callback) {
            var result = searchByProps(node, propMap);
            result._id = "fzeri/" + result.id;
            result.lang = "it";
            result.source = "fzeri";
            var model = new ExtractedArtwork(result);
            console.log(model);
            model.save(callback);
        }, function() {
            console.log("DONE:", matches.length);
            process.exit(0);
        });
    });
};

loadData();
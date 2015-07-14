var csv = require("csv-streamify");
var yr = require("yearrange");
/*
 * ID (WORK ID)
 * Title (TITLE)
 * Date (WORK DATE)
 * Category (FRICK CLASSIFICATION)
 * Material (MATERIAL)
 * Artist (CREATOR)
 * Artist Dates (CREATOR DATES)
 * Artist School (SCHOOL)
 * ??? (VARIANT ARTIST)
 * Dimensions (MEASUREMENTS)
 * Collection (COLLECTION)
 * Collection Location (COLLECTION CITY)
 * Sources (SOURCES)
 */

/*
 * Image ID (BIBLIOGRAPHIC RECORD NUMBER)
 * PATH
 */

var propMap = {
    id: "WORK ID",
    title: "TITLE",
    date: ["WORK DATE", function(date) {
        return yr.parse(date);
    }],
    categories: "FRICK CLASSIFICATION",
    material: "MATERIAL",
    // object type?
    artist: {
        name: "CREATOR",
        dates: ["CREATOR DATES", function(date) {
            return yr.parse(date);
        }],
        school: "SCHOOL"
    },
    // VARIANT ARTIST ???
    dimensions: "MEASUREMENTS",
    collection: {
        location: "COLLECTION CITY",
        name: "COLLECTION"
    },
    images: {
        id: "BIBLIOGRAPHIC RECORD NUMBER",
        fileName: ["PATH", function(path) {
            return /([^\/]*)$/.exec(path.replace(/\.tif$/, ""))[0];
        }]
    }
};

var searchByProps = function(row, propMap) {
    var results = {};

    for (var propName in propMap) {
        var searchValue = propMap[propName];

        if (typeof searchValue === "string") {
            var value = row[searchValue];
            if (value) {
                results[propName] = value;
            }

        } else if (Array.isArray(searchValue)) {
            var value = row[searchValue[0]];
            results[propName] = searchValue[1](value);

        } else if (typeof searchValue === "object") {
            results[propName] = searchByProps(row, searchValue);
        }
    }

    return results;
};

process.stdin
    .pipe(csv({
        objectMode: true,
        delimiter: "\t",
        columns: true
    }))
    .on("data", function(data) {
        var result = searchByProps(data, propMap);
        if (result.id) {
            console.log(result);
        }
    })
    .on("close", function() {
        console.log("DONE");
    });

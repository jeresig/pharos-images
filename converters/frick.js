var csv = require("csv-streamify");
var yr = require("yearrange");

var dates = {};
var dateTypes = {};

process.stdin
    .pipe(csv({
        objectMode: true,
        delimiter: "\t",
        columns: true
    }))
    .on("data", function(data) {
        var path = (data["PATH"] || "").trim();
        var date = data["WORK DATE"];

        if (/([^\/]+).tif/.test(path)) {
            path = RegExp.$1;
        } else {
            return;
        }

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

        console.log(data)

        var dateType = date.replace(/\d/g, "*")
            .replace(/\.+$/, "").toLowerCase();

        if (!(dateType in dateTypes)) {
            dateTypes[dateType] = date;
            //console.log(dateType + "\t" + date);
        }

        if (!(date in dates)) {
            var range = yr.parse(date);
            if (range && range.start && range.start > 1000) {
                dates[date] = Math.floor(range.start / 100) + 1;
            } else {
                //console.log("Not found?", date)
                dates[date] = 0;
            }
        }

        var artworkID = /^\d+/.exec(path)[0];
        //console.log(["frick", artworkID, path, dates[date]].join(","));
    })
    .on("close", function() {
        Object.keys(dates).forEach(function(date) {
            if (dates[date] === 0) {
                //console.log(date);
            }
        });
    });

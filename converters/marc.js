var fs = require("fs");

var marc = require("marcjs");

var propMap = {
    id: ["001"],
    title: ["245", "a"],
    dateCreated: ["260", "c"],
    categories: ["650", "a", "y", "z"],
    material: ["300", "a"],
    artists: ["100", "a", "d"],
    dimensions: ["300", "c"],
    collections: ["710", "a"],
    images: ["856", "u"]
};

var stream = fs.createReadStream(process.argv[2]);
var reader = new marc.getReader(stream, "iso2709");

reader.on("data", function(record) {
    console.log(JSON.stringify(record.toMiJ(), null, "    "));
});

reader.on("end", function() {
    console.log("DONE");
    //process.exit(0);
});
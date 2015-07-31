var fs = require("fs");

var marc = require("marcjs");

var stream = fs.createReadStream(process.argv[2]);
var reader = new marc.getReader(stream, "iso2709");

reader.on("data", function(record) {
    console.log(record);
});

reader.on("end", function() {
    console.log("DONE");
    //process.exit(0);
});
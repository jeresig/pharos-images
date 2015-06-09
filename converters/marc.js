var fs = require("fs");

var marc = require("marcjs");

var reader = new marc.MarcxmlReader(process.stdin);

reader.on("data", function(record) {
    console.log(record);
});

reader.on("end", function() {
    console.log("DONE");
    process.exit(0);
});

var fs = require("fs");

var jsonld = require("jsonld");

var nquads = fs.readFileSync(process.argv[2], "utf8");

jsonld.fromRDF(nquads, {format: "application/nquads"}, function(err, doc) {
    console.log(JSON.stringify(doc, null, "    "));
});

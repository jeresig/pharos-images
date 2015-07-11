/*
 * ID (SERCD)
 * Title/Subject (SGTI)
 * Date (DTSI - from, DTSF - to, DTSV/DTSL - approximation)
 * Category ?
 * Medium/Material (MTC)
 * Object Type (OGTT)
 * Dimensions (MISA - height, MISL - width, MISU - unit)
 * Collection (LCDN)
 * Collection Location (PVCS + PVCC)
 * For each RIPETIZIONE:
 * Artist (AUTN + AUTP for pseudonym)
 * Artist Dates/School?
 */

/*
 * ID (FOTO/@sercdf)
 * Image Path (FOTO)
 */
var fs = require("fs");
var libxmljs = require("libxmljs");

var file = process.argv[2];

var xmlDoc = libxmljs.parseXml(fs.readFileSync(file, "utf8"));

xmlDoc.find("//SCHEDA").forEach(function(node) {
    //var id = node.attr("sercdoa").value();

    var id = node.get(".//SERCD").text();
    var imageID = /\/([\w\d]+).jpg/.exec(path)[1];

    map[id].push(imageID);
});
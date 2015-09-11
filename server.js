var express = require("express");
var passport = require("passport");
var env = process.env.NODE_ENV || "development";
var fs = require("fs");

// Load in configuration options
require("dotenv").load();

require("express-namespace");

var ukiyoe = require("ukiyoe-models");

ukiyoe.db.connect(function() {
    fs.readdirSync(__dirname + "/app/models").forEach(function (file) {
        if (~file.indexOf(".js")) {
            require(__dirname + "/app/models/" + file)(ukiyoe);
        }
    });

    // Bootstrap passport config
    require("./config/passport")(passport, ukiyoe);

    var app = express();

    // Bootstrap application settings
    require("./config/express")(app, passport);

    // Bootstrap routes
    require("./config/routes")(app, passport, ukiyoe);

    // Start the app by listening on <port>
    var port = process.env.PORT;

    console.log("PORT: " + port);

    app.listen(port, function() {
        if (process.send) {
            process.send("online");
        }
    });

    process.on("message", function(message) {
        if (message === "shutdown") {
            process.exit(0);
        }
    });
});

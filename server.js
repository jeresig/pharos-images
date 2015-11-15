const fs = require("fs");

const express = require("express");

const i18n = require("./middlewares/i18n");
const cdn = require("./middlewares/cdn");

// Load in configuration options
require("dotenv").load();

const core = require("./models");

core.db.connect(function() {
    const app = express();

    // Bootstrap application settings
    require("./config/express")(app, core);

    // Bootstrap passport config
    require("./config/passport")(app, core);

    // Bootstrap routes
    require("./config/routes")(app, core);

    // Start the app by listening on <port>
    console.log(`PORT: ${process.env.PORT}`);

    app.listen(process.env.PORT, function() {
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
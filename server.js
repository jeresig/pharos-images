// Load in configuration options
require("dotenv").load();

const fs = require("fs");
const express = require("express");
const core = require("./models");

core.db.connect(function() {
    const app = express();

    // Load in the main server logic
    require("./server/express")(core, app);
    require("./server/passport")(core, app);
    require("./server/i18n")(core, app);
    require("./server/cdn")(core, app);
    require("./server/routes")(core, app);

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
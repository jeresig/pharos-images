"use strict";

const express = require("express");
const core = require("./core");

const port = process.env.PORT || 3000;

core.init(() => {
    const app = express();

    // Load in the main server logic
    require("./server/express")(core, app);
    require("./server/passport")(core, app);
    require("./server/i18n")(core, app);
    require("./server/cdn")(core, app);
    require("./server/routes")(core, app);

    // Start the app by listening on <port>
    console.log(`PORT: ${port}`);

    app.listen(port, () => {
        if (process.send) {
            process.send("online");
        }
    });

    process.on("message", (message) => {
        if (message === "shutdown") {
            process.exit(0);
        }
    });

    process.on("uncaughtException", (err) => {
        console.error("Exception:", err);

        if (process.send) {
            process.send("offline");
        }
    });

    // Automatically advance the different data importers
    core.models.ArtworkImport.startAdvancing();
    core.models.ImageImport.startAdvancing();
});

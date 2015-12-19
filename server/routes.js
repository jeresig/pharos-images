"use strict";

const fs = require("fs");
const path = require("path");

const basePath = path.resolve(__dirname, "../logic/");

module.exports = function(core, app) {
    // Import all the logic routes
    fs.readdirSync(basePath).forEach((file) => {
        if (file.endsWith(".js")) {
            const logic = require(path.resolve(basePath, file))(core, app);
            logic.routes();
        }
    });

    app.use((req, res, next) => {
        res.status(404).render("404", {
            url: req.originalUrl,
        });
    });
};

"use strict";

const fs = require("fs");
const path = require("path");

const rl = require("readline-sync");

const core = require("../core");

core.init(() => {
    const _id = rl.question("Source ID (e.g. frick): ");
    const name = rl.question("Full Name (e.g. Frick Library): ");
    const shortName = rl.question("Short Name (e.g. Frick): ");
    const url = rl.question("URL (http://...): ");
    const convertor = rl.question("Data Convertor [default]: ", {
        defaultInput: "default",
    });


    const source = new core.models.Source({
        _id,
        name,
        shortName,
        url,
        convertor,
    });

    source.save((err) => {
        if (err) {
            console.error(err);
        } else {
            // Create directories to hold images
            const dir = source.getDirBase();
            fs.mkdirSync(dir);
            fs.mkdirSync(path.join(dir, "images"));
            fs.mkdirSync(path.join(dir, "scaled"));
            fs.mkdirSync(path.join(dir, "thumbs"));

            console.log("CREATED");
        }

        process.exit();
    });
});

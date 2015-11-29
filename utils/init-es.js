"use strict";

const core = require("../core");

const Artwork = core.models.Artwork;

core.init(() => {
    console.log("Re-building index...");

    Artwork.createMapping((err, mapping) => {
        if (err) {
            return console.error(err);
        }

        let count = 0;

        Artwork.synchronize()
            .on("data", (err, doc) => {
                count++;
                console.log(`indexed ${count}`);
            })
            .on("close", () => {
                process.exit(0);
            })
            .on("error", (err) => {
                console.log(err);
            });
    });
});

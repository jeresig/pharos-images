"use strict";

const core = require("../core");

const Artwork = core.db.Artwork;

core.init(() => {
    Artwork.createMapping((err, mapping) => {
        if (err) {
            console.error(err);
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

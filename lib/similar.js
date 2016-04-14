"use strict";

let similar;

/* istanbul ignore else */
if (process.env.PASTEC_URL) {
    similar = require("pastec")({
        server: process.env.PASTEC_URL,
    });
}

// TODO(jeresig): Implement TinEye MatchEngine option

/* istanbul ignore if */
if (!similar) {
    console.error("No image similarity engine specified.");
}

module.exports = similar;

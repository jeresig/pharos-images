"use strict";

let similar;

if (process.env.PASTEC_URL) {
    similar = require("pastec")({
        server: process.env.PASTEC_URL,
    });
}

// TODO(jeresig): Implement TinEye MatchEngine option

if (!similar) {
    console.error("No image similarity engine specified.");
}

module.exports = () => similar;

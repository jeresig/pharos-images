"use strict";

let similar;

if (process.env.PASTEC_URL) {
    similar = require("pastec")({
        server: process.env.PASTEC_URL,
    });
}

// TODO(jeresig): Implement TinEye MatchEngine option

if (!similar) {
    throw new Error("No image similarity engine specified.");
}

module.exports = (core) => similar;

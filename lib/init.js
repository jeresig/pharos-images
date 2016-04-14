"use strict";

const async = require("async");

/* istanbul ignore if */
if (process.env.NODE_ENV !== "test") {
    // Load in configuration options
    require("dotenv").load();
}

const db = require("./db");
const models = require("./models");

module.exports = (callback) => {
    return new Promise((resolve, reject) => {
        async.series([
            (callback) => db.connect(callback),
            (callback) => models("Source").cacheSources(callback),
        ], (err) => {
            /* istanbul ignore if */
            if (callback) {
                callback(err);
            }

            /* istanbul ignore if */
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

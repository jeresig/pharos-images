"use strict";

const mongoose = require("mongoose");

// Make it so that mongoose models can be inherited from
require("mongoose-schema-extend");

const MONGODB_URL = process.env.MONGODB_URL;

/* istanbul ignore if */
if (!MONGODB_URL && process.env.NODE_ENV !== "test") {
    console.error("ENV MONGODB_URL not specified.");
    process.exit();
}

// Get Mongoose using native promises
mongoose.Promise = global.Promise;

/* istanbul ignore next */
const connect = (callback) => {
    /* istanbul ignore else */
    if (process.env.NODE_ENV === "test") {
        return process.nextTick(callback);
    }

    console.log("Connecting...");
    mongoose.connect(MONGODB_URL);

    mongoose.connection.on("error", (err) => {
        console.error("Mongo Connection Error:", err);
        callback(err);
    });

    mongoose.connection.once("open", callback);
};

module.exports = {
    mongoose: mongoose,
    schema: mongoose.Schema,
    types: mongoose.Types,

    connect,

    model(name, schema) {
        return mongoose.model(name, schema);
    },
};

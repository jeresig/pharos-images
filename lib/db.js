"use strict";

const url = require("url");

const mongoose = require("mongoose");
const versioner = require("mongoose-version");
const mongoosastic = require("mongoosastic");

// Make it so that mongoose models can be inherited from
require("mongoose-schema-extend");

// In the fig development environment we need to use
// this address instead of localhost
const esURL = process.env.ELASTICSEARCH_1_PORT_9200_TCP_ADDR;

const es = url.parse(esURL ?
    `http://${esURL}:9200` :
    process.env.ELASTICSEARCH_URL || "http://127.0.0.1:9200");

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error("ENV MONGODB_URL not specified.");
}

// Get Mongoose using native promises
mongoose.Promise = global.Promise;

module.exports = () => {
    return {
        mongoose: mongoose,
        schema: mongoose.Schema,

        connect(callback) {
            mongoose.connect(MONGODB_URL);

            mongoose.connection.on("error", (err) => {
                console.error("Mongo Connection Error:", err);
            });

            mongoose.connection.once("open", callback);
        },

        model(name, schema) {
            return schema ?
                mongoose.model(name, schema) :
                mongoose.model(name);
        },

        mongoosastic: {
            host: es.hostname,
            auth: es.auth,
            port: es.port,
            protocol: es.protocol === "https:" ? "https" : "http",
        },

        bindPlugins: {
            Artwork(schema) {
                schema.plugin(mongoosastic, this.mongoosastic);
                schema.plugin(versioner, {
                    collection: "artwork_versions",
                    suppressVersionIncrement: false,
                    strategy: "collection",
                    mongoose: mongoose,
                });
            },

            Image(schema) {
                schema.plugin(versioner, {
                    collection: "image_versions",
                    suppressVersionIncrement: false,
                    strategy: "collection",
                    mongoose: mongoose,
                });
            },
        },
    };
};

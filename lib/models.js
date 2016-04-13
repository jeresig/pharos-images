"use strict";

const url = require("url");

const versioner = require("mongoose-version");
const mongoosastic = require("mongoosastic");

const models = {};

// In the fig development environment we need to use
// this address instead of localhost
const esURL = process.env.ELASTICSEARCH_1_PORT_9200_TCP_ADDR;

/* istanbul ignore next */
const es = url.parse(esURL ?
    `http://${esURL}:9200` :
    process.env.ELASTICSEARCH_URL || "http://127.0.0.1:9200");

const mongoosasticServer = {
    host: es.hostname,
    auth: es.auth,
    port: es.port,
    // Trim the trailing ":" from the protocol
    protocol: es.protocol.slice(0, -1),
};

// TODO: Move these into the schema definitions
const bindPlugins = {
    Artwork(schema, mongoose) {
        schema.plugin(mongoosastic, mongoosasticServer);
        schema.plugin(versioner, {
            collection: "artwork_versions",
            suppressVersionIncrement: false,
            strategy: "collection",
            mongoose: mongoose,
        });
    },

    Image(schema, mongoose) {
        schema.plugin(versioner, {
            collection: "image_versions",
            suppressVersionIncrement: false,
            strategy: "collection",
            mongoose: mongoose,
        });
    },
};

module.exports = (core) => (name) => {
    const db = require("./db")(core);

    if (models[name]) {
        return models[name];
    }

    const schema = require(`../schemas/${name}.js`)(core);

    if (bindPlugins[name]) {
        bindPlugins[name](schema, db.mongoose);
    }

    models[name] = db.model(name, schema);

    return models[name];
};

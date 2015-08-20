var url = require("url");

var mongoose = require("mongoose");
var extend = require("mongoose-schema-extend");

var ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;

// In the fig development environment we need to use
// this address instead of localhost
var esURL = process.env.ELASTICSEARCH_1_PORT_9200_TCP_ADDR

if (esURL) {
    ELASTICSEARCH_URL = "http://" + esURL + ":9200";
}

var es = url.parse(ELASTICSEARCH_URL || "http://127.0.0.1:9200");

var MONGODB_URL = process.env.MONGODB_URL;

/* NOTE(jeresig): This may not actually be needed?

// In the fig development environment we need to use
// this address instead of localhost
var mongoHost = process.env.MONGODB_1_PORT_27017_TCP_ADDR;

if (mongoHost) {
    MONGODB_URL = MONGODB_URL.replace(/:\/\/[^:]+/, "://" + mongoHost);
}
*/

if (!MONGODB_URL) {
    throw "ENV MONGODB_URL not specified.";
}

module.exports = function(ukiyoe) {
    return {
        mongoose: mongoose,
        schema: mongoose.Schema,

        connect: function(callback) {
            mongoose.connect(MONGODB_URL);

            mongoose.connection.on("error", function(err) {
                console.error("Connection Error:", err)
            });

            mongoose.connection.once("open", callback);
        },

        model: function(name, schema) {
            if (!schema) {
                return mongoose.model(name);
            } else {
                return mongoose.model(name, schema);
            }
        },

        mongoosastic: {
            host: es.hostname,
            auth: es.auth,
            port: es.port,
            protocol: es.protocol === "https:" ? "https" : "http"
        }
    };
};
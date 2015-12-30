"use strict";

module.exports = (core) => new core.db.schema({
    country: {type: String, es_indexed: true},
    city: {type: String, es_indexed: true},
    name: {type: String, es_indexed: true},
}, {
    _id: false,
});

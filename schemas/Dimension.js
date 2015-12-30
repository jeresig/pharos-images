"use strict";

module.exports = (core) => new core.db.schema({
    original: String,
    width: {type: Number, es_indexed: true},
    height: {type: Number, es_indexed: true},
    depth: {type: Number, es_indexed: true},
    label: String,
    unit: {type: String, es_indexed: true},
}, {
    _id: false,
});

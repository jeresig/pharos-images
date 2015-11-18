"use strict";

module.exports = (core) => new core.db.schema({
    original: String,
    label: String,
    circa: Boolean,
    start: {type: Number, es_indexed: true},
    start_ca: Boolean,
    end: {type: Number, es_indexed: true},
    end_ca: Boolean,
    current: {type: Boolean, es_indexed: true}
});
"use strict";

module.exports = (core) => new core.db.schema({
    _id: String,
    name: String,
    startYear: Number,
    endYear: Number
});
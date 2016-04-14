"use strict";

const db = require("../lib/db");

const YearRange = new db.schema({
    // An ID for the year range, computed from the original + start/end
    // properties before validation.
    _id: String,

    // The source string from which the year range was generated
    original: String,

    // A label associated with the year range (e.g. "modified")
    label: String,

    // If the date should be treated as "circa"
    circa: Boolean,

    // The date range start and end
    start: {type: Number, es_indexed: true},
    start_ca: Boolean,
    end: {type: Number, es_indexed: true},
    end_ca: Boolean,

    // If the end date is the current day
    current: {type: Boolean, es_indexed: true},

    // A generated list of years which this year range maps to. This is
    // indexed in Elasticsearch for things like histograms and
    // aggregations.
    years: [{type: Number, es_indexed: true}],
});

YearRange.methods = {
    toJSON() {
        const obj = this.toObject();
        delete obj.original;
        delete obj.years;
        return obj;
    },
};

// We generate a list of years in which the artwork exists, in order
// to improve querying inside Elasticsearch
YearRange.pre("validate", function(next) {
    if (!this.start || !this.end || this.start > this.end) {
        return next();
    }

    // NOTE(jeresig): This will get much better once generators
    // are available in Node!
    const years = [];

    for (let year = this.start; year <= this.end; year += 1) {
        years.push(year);
    }

    this.years = years;

    next();
});

// Dynamically generate the _id attribute
YearRange.pre("validate", function(next) {
    this._id = this.original || [this.start, this.end].join(",");
    next();
});

module.exports = YearRange;

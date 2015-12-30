"use strict";

module.exports = (core) => new core.db.schema({
    original: String,
    label: String,
    circa: Boolean,
    start: {type: Number, es_indexed: true},
    start_ca: Boolean,
    end: {type: Number, es_indexed: true},
    end_ca: Boolean,
    current: {type: Boolean, es_indexed: true},
    // A generated list of years which this year range maps to. This is
    // indexed in Elasticsearch for things like histograms and aggregations.
    years: [{type: Number, es_indexed: true}],
}, {
    _id: false,
});

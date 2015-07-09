var mongoose = require("mongoose");

module.exports = function(lib) {
    var YearRangeSchema = new mongoose.schema({
        original: String,
        circa: Boolean,
        start: {type: Number, es_indexed: true},
        start_ca: Boolean,
        end: {type: Number, es_indexed: true},
        end_ca: Boolean,
        current: {type: Boolean, es_indexed: true}
    });

    return YearRangeSchema;
};
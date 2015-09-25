var mongoose = require("mongoose");

module.exports = function(lib) {
    var DimensionSchema = new mongoose.Schema({
        original: String,
        width: {type: Number, es_indexed: true},
        height: {type: Number, es_indexed: true},
        depth: {type: Number, es_indexed: true},
        label: String,
        unit: {type: String, es_indexed: true}
    });

    return DimensionSchema;
};
var mongoose = require("mongoose");

module.exports = function(lib) {
    var DimensionSchema = new mongoose.Schema({
        original: String,
        width: Number,
        height: Number,
        depth: Number,
        label: String,
        unit: String
    });

    return DimensionSchema;
};
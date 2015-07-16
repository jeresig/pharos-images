var mongoose = require("mongoose");

module.exports = function(lib) {
    var DimensionSchema = new mongoose.schema({
        original: String,
        width: Number,
        height: Number,
        depth: Number
    });

    return DimensionSchema;
};
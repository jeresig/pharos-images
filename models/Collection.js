var mongoose = require("mongoose");

module.exports = function(lib) {
    var CollectionSchema = new mongoose.Schema({
        country: String,
        city: String,
        name: String
    });

    return CollectionSchema;
};


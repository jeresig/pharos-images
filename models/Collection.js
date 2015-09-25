var mongoose = require("mongoose");

module.exports = function(lib) {
    var CollectionSchema = new mongoose.Schema({
        country: {type: String, es_indexed: true},
        city: {type: String, es_indexed: true},
        name: {type: String, es_indexed: true}
    });

    return CollectionSchema;
};


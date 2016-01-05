"use strict";

module.exports = (core) => {
    const Location = new core.db.schema({
        // An ID for the name, computed from all the properties
        // before validation.
        _id: String,

        // The country and city representing the location
        country: {type: String, es_indexed: true},
        city: {type: String, es_indexed: true},

        // The name of the location
        name: {type: String, es_indexed: true},
    });

    // Dynamically generate the _id attribute
    Location.pre("validate", function(next) {
        this._id = [this.country, this.city, this.name].join(",");
        next();
    });

    return Location;
};

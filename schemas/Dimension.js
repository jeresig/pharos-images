"use strict";

module.exports = (core) => {
    const Dimension = new core.db.schema({
        // An ID for the dimension, computed from the original + width/height
        // properties before validation.
        _id: String,

        // The source string from which the dimensions were generated
        original: String,

        // The width/height/depth of the object (stored in millimeters)
        width: {type: Number, es_indexed: true},
        height: {type: Number, es_indexed: true},
        depth: {type: Number, es_indexed: true},

        // A label for the dimensions (e.g. "with frame")
        label: String,

        // The unit for the dimensions (defaults to millimeters)
        unit: {type: String, es_indexed: true},
    });

    // Dynamically generate the _id attribute
    Dimension.pre("validate", function(next) {
        this._id = this.original ||
            (this.width || this.height ? this.width + this.height : "");
    });

    return Dimension;
};

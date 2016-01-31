"use strict";

module.exports = (core) => {
    return new core.db.schema({
        // The id of the result (equal to the fileName)
        _id: String,

        // The state of the batch upload
        state: {
            type: String,
            required: true,
        },

        // An optional error associated with the file
        error: String,

        // An array of string warnings
        warnings: [String],
    });
};

var mongoose = require("mongoose");

var BioSchema = new mongoose.Schema({
    "http://www.w3.org/2004/02/skos/core#prefLabel": String,
    "P131_is_identified_by": [
        {
            "http://www.w3.org/2000/01/rdf-schema#label": [String]
        }
    ],
    "P12i_was_present_at": [
        {
            "P4_has_time-span": [
                {
                    "P82_at_some_time_within": [String],
                    "P3_has_note": [String]
                }
            ]
        }
    ]
});

mongoose.model("Bio", BioSchema);
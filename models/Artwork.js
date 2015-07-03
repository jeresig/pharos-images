var mongoose = require("mongoose");

var ArtworkSchema = new mongoose.Schema({
    "P43_has_dimension": [
        {
            "@type": String,
            "P90_has_value": String,
            "P91_has_unit": {
                "@id": String
            }
        }
    ],
    "P70i_is_documented_in": {
        "P3_has_note": String
    },
    "P108i_was_produced_by": {
        "@type": String,
        "P9_consists_of": [
            {
                "@type": String,
                "P2_has_type": {
                    "@id": String
                },
                "P7_took_place_at": {
                    "@id": String
                },
                "P14_carried_out_by": {
                    "@id": String
                },
                "P32_used_general_technique": {
                    "@id": String
                },
                "P4_has_time-span": {
                    "@type": String,
                    "http://www.w3.org/2000/01/rdf-schema#label": String,
                    "P82b_end_of_the_end": String,
                    "P82a_begin_of_the_begin": String,
                    "P3_has_note": String
                }
            }
        ]
    },
    "P128_carries": [
        {
            "@type": String,
            "P129_is_about": {
                "@id": String
            }
        }
    ]
});

mongoose.model("Artwork", ArtworkSchema)
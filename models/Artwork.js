var mongoose = require("mongoose");

var ArtworkSchema = new mongoose.Schema({
    "P43_has_dimension": [
        {
            "@type": "E54_Dimension",
            "P90_has_value": String,
            "P91_has_unit": {
                "@id": String
            }
        }
    ]
});

mongoose.model("Artwork", ArtworkSchema)
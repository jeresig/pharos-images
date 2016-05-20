"use strict";

const Name = require("../schemas/types/Name.js");
const YearRange = require("../schemas/types/YearRange.js");
const FixedString = require("../schemas/types/FixedString.js");
const SimpleString = require("../schemas/types/SimpleString.js");
const Dimension = require("../schemas/types/Dimension.js");
const Location = require("../schemas/types/Location.js");
const types = require("./types.js");

module.exports = [
    // A list of artist names extracted from the page.
    new Name({
        name: "artist",
        modelName: "artists",
        title: (i18n) => i18n.gettext("Artist"),
        placeholder: (i18n) => i18n.gettext("Sample: Andrea del Sarto"),
    }),

    // Date ranges when the artwork was created or modified.
    new YearRange({
        name: "date",
        modelName: "dates",
        title: (i18n) => i18n.gettext("Date"),
        placeholder: {
            end: 1900,
            start: 1000,
        },
    }),

    // The English form of the object type (e.g. painting, print)
    new FixedString({
        name: "objectType",
        title: (i18n) => i18n.gettext("Type"),
        placeholder: (i18n) => i18n.gettext("Any Type"),
        allowUnknown: false,
        values: types,
        recommended: true,
    }),

    // The size of the artwork (e.g. 100mm x 200mm)
    new Dimension({
        name: "dimensions",
        heightTitle: (i18n) => i18n.gettext("Height"),
        widthTitle: (i18n) => i18n.gettext("Width"),
    }),

    // Locations where the artwork is stored
    new Location({
        name: "location",
        modelName: "locations",
        title: (i18n) => i18n.gettext("Location"),
        placeholder: (i18n) => i18n.gettext("Sample: Louvre"),
    }),

    // The medium of the artwork (e.g. "watercolor")
    new SimpleString({
        name: "medium",
        title: (i18n) => i18n.gettext("Medium"),
    }),
];

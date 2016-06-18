"use strict";

const Name = require("../schemas/types/Name.js");
const YearRange = require("../schemas/types/YearRange.js");
const FixedString = require("../schemas/types/FixedString.js");
const SimpleString = require("../schemas/types/SimpleString.js");
const Dimension = require("../schemas/types/Dimension.js");
const Location = require("../schemas/types/Location.js");
const types = require("./types.js");

module.exports = {
    // The title of the artwork.
    title: new SimpleString({
        name: "title",
        title: (i18n) => i18n.gettext("Title"),
        recommended: true,
    }),

    // A list of artist names extracted from the page.
    artists: new Name({
        name: "artist",
        modelName: "artists",
        title: (i18n) => i18n.gettext("Artist"),
        placeholder: (i18n) => i18n.gettext("Sample: Andrea del Sarto"),
    }),

    // Date ranges when the artwork was created or modified.
    dates: new YearRange({
        name: "date",
        modelName: "dates",
        title: (i18n) => i18n.gettext("Date"),
        placeholder: () => ({
            end: 1900,
            start: 1000,
        }),
    }),

    // The English form of the object type (e.g. painting, print)
    objectType: new FixedString({
        name: "objectType",
        searchField: "type",
        title: (i18n) => i18n.gettext("Type"),
        placeholder: (i18n) => i18n.gettext("Any Type"),
        allowUnknown: false,
        values: types,
        recommended: true,
    }),

    // The medium of the artwork (e.g. "watercolor")
    medium: new SimpleString({
        name: "medium",
        title: (i18n) => i18n.gettext("Medium"),
        searchField: "filter",
    }),

    // The size of the artwork (e.g. 100mm x 200mm)
    dimensions: new Dimension({
        name: "dimensions",
        title: (i18n) => i18n.gettext("Dimensions"),
        heightTitle: (i18n) => i18n.gettext("Height"),
        widthTitle: (i18n) => i18n.gettext("Width"),
        placeholder: () => ({
            max: 200,
            min: 10,
        }),
    }),

    // Locations where the artwork is stored
    locations: new Location({
        name: "location",
        modelName: "locations",
        title: (i18n) => i18n.gettext("Location"),
        placeholder: (i18n) => i18n.gettext("Sample: Louvre"),
    }),

    // Categories classifying the artwork
    // The medium of the artwork (e.g. "watercolor")
    categories: new SimpleString({
        name: "categories",
        title: (i18n) => i18n.gettext("Categories"),
        multiple: true,
        searchField: "filter",
    }),
};

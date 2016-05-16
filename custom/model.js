"use strict";

const Name = require("../schemas/types/Name.js");
const YearRange = require("../schemas/types/YearRange.js");

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
];

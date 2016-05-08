"use strict";

const Name = require("../schemas/types/Name.js");

module.exports = [
    // A list of artist names extracted from the page.
    new Name({
        name: "artist",
        modelName: "artists",
        title: (i18n) => i18n.gettext("Artist"),
        placeholder: (i18n) => i18n.gettext("Sample: Andrea del Sarto"),
    }),
];

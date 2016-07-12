"use strict";

const types = require("./custom/types");

module.exports = {
    getShortTitle: () => "PHAROS",

    getSubTitle: (i18n) => i18n.gettext("Art Research Database"),

    getTitle(i18n) {
        return `${this.getShortTitle(i18n)}: ${this.getSubTitle(i18n)}`;
    },

    getSearchPlaceholder: (i18n) => i18n.gettext("Sample: christ or cristo"),

    filters: ["artists", "locations", "objectType", "dates", "dimensions"],

    display: ["artists", "dates", "objectType", "medium", "dimensions",
        "categories", "locations"],

    sorts: {
        "dates.asc": (i18n) => i18n.gettext("Date, earliest first"),
        "dates.desc": (i18n) => i18n.gettext("Date, latest first"),
    },

    model: {
        // The title of the artwork.
        title: {
            type: "SimpleString",
            title: (i18n) => i18n.gettext("Title"),
            recommended: true,
        },

        // A list of artist names extracted from the page.
        artists: {
            type: "Name",
            searchName: "artist",
            title: (i18n) => i18n.gettext("Artist"),
            placeholder: (i18n) => i18n.gettext("Sample: Andrea del Sarto"),
        },

        // Date ranges when the artwork was created or modified.
        dates: {
            type: "YearRange",
            searchName: "date",
            title: (i18n) => i18n.gettext("Date"),
            placeholder: () => ({
                end: 1900,
                start: 1000,
            }),
        },

        // The English form of the object type (e.g. painting, print)
        objectType: {
            type: "FixedString",
            searchName: "type",
            title: (i18n) => i18n.gettext("Type"),
            placeholder: (i18n) => i18n.gettext("Any Type"),
            allowUnknown: false,
            values: types,
            recommended: true,
            url: (value) => `/type/${value}`,
        },

        // The medium of the artwork (e.g. "watercolor")
        medium: {
            type: "SimpleString",
            title: (i18n) => i18n.gettext("Medium"),
            searchField: "filter",
        },

        // The size of the artwork (e.g. 100mm x 200mm)
        dimensions: {
            type: "Dimension",
            title: (i18n) => i18n.gettext("Dimensions"),
            heightTitle: (i18n) => i18n.gettext("Height"),
            widthTitle: (i18n) => i18n.gettext("Width"),
            placeholder: () => ({
                max: 200,
                min: 10,
            }),
        },

        // Locations where the artwork is stored
        locations: {
            type: "Location",
            searchName: "location",
            title: (i18n) => i18n.gettext("Location"),
            placeholder: (i18n) => i18n.gettext("Sample: Louvre"),
        },

        // Categories classifying the artwork
        // The medium of the artwork (e.g. "watercolor")
        categories: {
            type: "SimpleString",
            title: (i18n) => i18n.gettext("Categories"),
            multiple: true,
            searchField: "filter",
        },
    },
};

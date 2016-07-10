"use strict";

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
};

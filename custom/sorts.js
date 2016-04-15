"use strict";

module.exports = {
    dateAsc: {
        name: (req) => req.gettext("Date, earliest first"),
        sort: [
            {
                "dates.start": {
                    "order": "asc",
                },
            },
            {
                "dates.end": {
                    "order": "asc",
                },
            },
        ],
    },

    dateDesc: {
        name: (req) => req.gettext("Date, latest first"),
        sort: [
            {
                "dates.end": {
                    "order": "desc",
                },
            },
            {
                "dates.start": {
                    "order": "desc",
                },
            },
        ],
    },
};

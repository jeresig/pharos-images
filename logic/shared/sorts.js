"use strict";

module.exports = {
    dateAsc: {
        name: (req) => req.gettext("Date, newest first"),
        sort: [
            {
                "dateCreateds.start": {
                    "order": "asc",
                },
            },
            {
                "dateCreateds.end": {
                    "order": "asc",
                },
            },
        ],
    },

    dateDesc: {
        name: (req) => req.gettext("Date, oldest first"),
        sort: [
            {
                "dateCreateds.end": {
                    "order": "desc",
                },
            },
            {
                "dateCreateds.start": {
                    "order": "desc",
                },
            },
        ],
    },
};

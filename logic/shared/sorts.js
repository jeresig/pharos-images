"use strict";

module.exports = {
    dateAsc: {
        name: (res) => res.locals.gettext("Date, newest first"),
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
        name: (res) => res.locals.gettext("Date, oldest first"),
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

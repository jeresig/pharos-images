"use strict";

const queries = require("./queries");

const paramFilter = (req, options, keepSecondary) => {
    const params = Object.assign({}, req.query, req.params, options);
    const all = {};
    const primary = [];
    const secondary = {};

    for (const param in queries) {
        const query = queries[param];
        const value = query.value({query: params});

        // Ignore queries that don't have a value
        if (!value) {
            continue;
        }

        // Ignore params which are the same as the default value
        if (query.defaultValue && query.defaultValue(req) === value) {
            continue;
        }

        const fields = query.fields ? query.fields() : [param];

        for (const field of fields) {
            const value = params[field];

            if (query.secondary) {
                secondary[field] = value;
            } else {
                primary.push(field);
            }

            if (keepSecondary || !query.secondary) {
                all[field] = value;
            }
        }
    }

    return {
        all,
        primary,
        secondary,
    };
};

module.exports = paramFilter;

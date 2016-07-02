"use strict";

const queries = require("./queries");

const paramFilter = (values, keepSecondary) => {
    const all = {};
    const primary = [];
    const secondary = {};

    for (const name in values) {
        const query = queries[name];
        const value = values[name];

        // Ignore queries that don't have a value
        if (value === undefined) {
            continue;
        }

        // Ignore params which are the same as the default value
        if (query.defaultValue && query.defaultValue() === value) {
            continue;
        }

        const fields = query.fields ?
            query.fields(value) :
            {[name]: value};

        if (query.secondary) {
            Object.assign(secondary, fields);
        } else {
            for (const field in fields) {
                primary.push(field);
            }
        }

        if (keepSecondary || !query.secondary) {
            Object.assign(all, fields);
        }
    }

    return {
        all,
        primary,
        secondary,
    };
};

module.exports = paramFilter;

"use strict";

const qs = require("querystring");

const urls = require("../../lib/urls");
const queries = require("./queries");

const paramFilter = (req, options, keepSecondary) => {
    const params = Object.assign({}, req.query, req.params, options);
    const all = {};
    const primary = [];
    const secondary = {};

    for (const param in queries) {
        const query = queries[param];
        console.log(param, query, params);
        const value = query.value({query: params});

        // Ignore queries that don't have a value
        if (!value) {
            continue;
        }

        // Ignore params which are the same as the default value
        if (query.defaultValue && query.defaultValue(req) === value) {
            continue;
        }

        const fields = query.fields ? query.fields() : param;

        for (const field of fields) {
            const value = req.query[field];

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

const searchURL = (req, options, keepSecondary) => {
    const params = paramFilter(req, options, keepSecondary);
    const primary = params.primary;
    let queryString = qs.stringify(params.all);
    let url = urls.gen(req.lang, "/search");

    if (primary.length === 1 && queries[primary[0]].url) {
        queryString = qs.stringify(params.secondary);
        url = queries[params.primary[0]].url(params.all);
        if (url.getURL) {
            url = url.getURL(req.lang);
        } else {
            url = urls.gen(req.lang, url);
        }
    }

    if (queryString) {
        const prefix = url.indexOf("?") >= 0 ? "&" : "?";
        queryString = `${prefix}${queryString}`;
    }

    return `${url}${queryString}`;
};

module.exports = {
    paramFilter,
    searchURL,
};

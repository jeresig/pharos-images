"use strict";

const qs = require("querystring");

const urls = require("../../lib/urls");
const queries = require("../../logic/shared/queries");

module.exports = (req, res, next) => {
    req.paramFilter = () => {
        const all = {};
        const primary = [];
        const secondary = {};

        for (const param in queries) {
            const query = queries[param];
            const value = query.value(req);

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
                if (query.secondary) {
                    secondary[field] = req.query[field];
                } else {
                    primary.push(field);
                }

                all[field] = req.query[field];
            }
        }

        return {
            all,
            primary,
            secondary,
        };
    };

    res.locals.searchURL = req.searchURL = (options, keepSecondary) => {
        const params = req.paramFilter(options, keepSecondary);
        let queryString = qs.stringify(params.all);
        let url = urls.gen(req.lang, "/search");

        if (params.primary.length === 1 &&
                queries[params.primary[0]].url) {
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

    next();
};

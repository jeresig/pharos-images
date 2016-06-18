"use strict";

const qs = require("querystring");

const urls = require("../../lib/urls");
const queries = require("../../logic/shared/queries");

module.exports = (req, res, next) => {
    req.paramFilter = (options, keepSecondary) => {
        // TODO: Use something instead of res.locals.query
        const all = Object.assign({}, res.locals.query, options);
        const primary = [];
        const secondary = {};

        for (const param in all) {
            if (!queries[param]) {
                console.error(`ERROR: Unknown search param: ${param}`);
                continue;
            }

            if (!all[param] || (queries[param].defaultValue &&
                    all[param] === queries[param].defaultValue(req)) ||
                    !keepSecondary && queries[param].secondary) {
                delete all[param];
            } else if (queries[param].secondary) {
                secondary[param] = all[param];
            } else if (!queries[param].pair ||
                    primary.indexOf(queries[param].pair) < 0) {
                primary.push(param);
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

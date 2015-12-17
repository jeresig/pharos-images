"use strict";

const qs = require("querystring");

module.exports = (core, app) => {
    const Source = core.models.Source;

    const queries = require("../../logic/shared/queries");

    return (req, res, next) => {
        res.locals.searchURL = (options, value) => {
            if (typeof options === "string") {
                const tmp = {};
                tmp[options] = value;
                options = tmp;
            }

            // TODO: Use something instead of res.locals.query
            const params = Object.assign({}, res.locals.query, options);

            for (const param in params) {
                if (!params[param] ||
                    (queries[param].defaultValue &&
                        params[param] === queries[param].defaultValue(req))) {
                    delete params[param];
                }
            }

            if (Object.keys(params).length === 1) {
                if ("source" in params) {
                    return Source.getSource(params.source)
                        .getURL(res.locals.lang);
                } else if ("type" in params) {
                    return core.urls.gen(res.locals.lang,
                        `/type/${params.type}`);
                }
            }

            const paramString = qs.stringify(params);

            return core.urls.gen(res.locals.lang,
                `/search${paramString ? "?" : ""}${paramString}`);
        };

        next();
    };
};

"use strict";

const qs = require("querystring");

const moment = require("moment");
const pd = require("parse-dimensions");

const urls = require("../../lib/urls");
const config = require("../../lib/config");

const types = config.types;

module.exports = (req, res, next) => {
    const methods = {
        getOtherURL(locale) {
            return urls.gen(locale, req.path);
        },

        URL(path, query) {
            let url = path.getURL ?
                path.getURL(req.lang) :
                urls.gen(req.lang, path);

            if (query) {
                url = url + (url.indexOf("?") >= 0 ? "&" : "?") +
                    qs.stringify(query);
            }

            return url;
        },

        urlFromID(id) {
            return urls.gen(req.lang, `/artworks/${id}`);
        },

        fullName(item) {
            const locale = req.lang;
            return item.getFullName ?
                item.getFullName(locale) :
                locale === "ja" && item.kanji || item.name || item;
        },

        shortName(item) {
            if (item && item.getShortName) {
                return item.getShortName(req.lang);
            }
        },

        getTitle(item) {
            return item.getTitle(req);
        },

        getDate(item) {
            if (item.original) {
                return item.original;
            }

            if (item.start || item.end) {
                return (item.circa ? "ca. " : "") +
                    item.start + (item.end && item.end !== item.start ?
                    `-${item.end}` : "");
            }

            return "";
        },

        getDimension(item) {
            const label = item.label;
            const dimension = pd.convertDimension(item, req.unit());
            const unit = dimension.unit;
            return [dimension.width, unit, " x ", dimension.height, unit,
                label ? ` (${label})` : ""].join("");
        },

        getType(item) {
            const type = types[item.objectType];
            return type ? type.name(req) : item.objectType;
        },

        // Format a number using commas
        // TODO: Handle locale here, as well
        stringNum(num) {
            const result = (typeof num === "number" ? num : "");
            return result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },

        relativeDate(date) {
            return moment(date).locale(req.lang).fromNow();
        },

        fixedDate(date) {
            return moment(date).locale(req.lang).format("LLL");
        },

        getUnit() {
            return req.unit();
        },
    };

    Object.assign(res.locals, methods);

    req.numRange = (bucket) => bucket.to ?
        `${bucket.from || 0}-${bucket.to}${bucket.unit || ""}` :
        `${bucket.from}${bucket.unit || ""}+`;

    req.defaultUnit = () => config.DEFAULT_UNIT;
    req.unit = () => req.query.unit || req.defaultUnit();

    next();
};

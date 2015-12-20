"use strict";

const urls = require("../../lib/urls")();
const locales = require("../../config/locales.json");
const types = require("../../logic/shared/types");

module.exports = (req, res, next) => {
    const methods = {
        SITE_NAME: process.env.SITE_NAME,
        SITE_NAME_SHORT: process.env.SITE_NAME_SHORT,

        // An option to disable indexing of the entire site
        noIndex: !!process.env.NO_INDEX,

        getLocales() {
            return Object.keys(locales);
        },

        getLocaleName(locale) {
            return locales[locale];
        },

        getOtherURL(locale) {
            return urls.gen(locale, req.path);
        },

        qsLocale() {
            return req.query.lang;
        },

        URL(path) {
            return path.getURL ?
                path.getURL(req.lang) :
                urls.gen(req.lang, path);
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
            return item.getTitle(req.lang);
        },

        getDate(item) {
            if (item.dateCreated) {
                return locales.getDate(item.dateCreated);
            }

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
            // TODO: Use locale to show ft vs. cm
            const unit = item.unit || "mm";
            return [item.width, unit, " x ", item.height, unit,
                item.label ? ` (${item.label})` : ""].join("");
        },

        getType(item) {
            const type = types[item.objectType];
            return type ? type.name(req) : item.objectType;
        },

        // Format a number using commas
        // TODO: Handle locale here, as well
        stringNum(num) {
            num = (typeof num === "number" ? num : "");
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
    };

    Object.assign(res.locals, methods);

    req.numRange = (bucket) => bucket.to ?
        `${bucket.from || 0}-${bucket.to}` :
        `${bucket.from}+`;

    next();
};

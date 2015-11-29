"use strict";

const urls = require("../../lib/urls")();
const locales = require("../../config/locales.json");

module.exports = (req, res, next) => {
    const methods = {
        SITE_NAME: process.env.SITE_NAME,

        getLocales() {
            return Object.keys(locales);
        },

        getLocaleName(locale) {
            return locales[locale];
        },

        getSiteCategory() {
            if (req.path.indexOf("/source") === 0) {
                return "sources";
            } else if (req.path.indexOf("/artist") === 0) {
                return "artists";
            } else if (req.path.indexOf("/about") === 0) {
                return "about";
            } else if (!req.path || req.path === "/") {
                return "home";
            }

            return "search";
        },

        getOtherURL(locale) {
            return urls.gen(locale, req.path);
        },

        curLocale() {
            return res.locals.lang;
        },

        qsLocale() {
            return req.query.lang;
        },

        URL(path) {
            return path.getURL ?
                path.getURL(res.locals.lang) :
                urls.gen(res.locals.lang, path);
        },

        fullName(item) {
            const locale = res.locals.lang;
            return item.getFullName ?
                item.getFullName(locale) :
                locale === "ja" && item.kanji || item.name || item;
        },

        shortName(item) {
            if (item && item.getShortName) {
                return item.getShortName(res.locals.lang);
            }
        },

        getTitle(item) {
            return item.getTitle(res.locals.lang);
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

        // Format a number using commas
        // TODO: Handle locale here, as well
        stringNum(num) {
            num = (typeof num === "number" ? num : "");
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
    };

    Object.assign(res.locals, methods);

    next();
};

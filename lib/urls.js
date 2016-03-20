"use strict";

const path = require("path");

const locales = require("../config/locales.json");

const defaultLocale = Object.keys(locales)[0];
const env = process.env.NODE_ENV;
const port = process.env.PORT || 3000;

/* istanbul ignore if */
if (env === "production") {
    if (!process.env.BASE_URL) {
        throw new Error("You must specify a BASE_URL.");
    }

    if (!process.env.BASE_DATA_URL) {
        throw new Error("You must specify a BASE_DATA_URL.");
    }
}

const genURL = (locale, urlBase, path) => {
    let suffix = "";

    // Use sub-domains to track the locale
    const base = (locale === defaultLocale || !locale || env !== "production" ?
        urlBase :
        /* istanbul ignore next */
        urlBase.replace("://", `://${locale}.`));

    // Only use a query string in dev mode and if we're
    // on a non-default locale
    if (env !== "production" && locale && locale !== defaultLocale) {
        const prefix = /\?/.test(path) ? "&" : "?";
        suffix = `${prefix}lang=${locale}`;
    }

    // Make sure we don't have an accidental // in the URL
    return base.replace(/\/$/, "") + path + suffix;
};

// The base URL for all pages
const base = () => {
    return process.env.BASE_URL || `http://localhost:${port}`;
};

// The base URL for storage
const baseData = () => {
    return process.env.BASE_DATA_URL || `http://localhost:${port}/data`;
};

// The base path for storage
const basePath = () => process.env.BASE_DATA_DIR;

module.exports = () => ({
    // Generate a URL given a path and a locale
    gen(locale, path) {
        return genURL(locale, base(), path);
    },

    // Generate a URL to a data file, given a path
    genData(filePath) {
        return genURL(null, baseData(), filePath);
    },

    // Generate a path to a data file, given a path
    genLocalFile(filePath) {
        return path.resolve(basePath(), filePath);
    },
});

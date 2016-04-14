"use strict";

const path = require("path");

const config = require("./config");
const locales = require("../config/locales.json");

const defaultLocale = Object.keys(locales)[0];

const genURL = (locale, urlBase, path) => {
    let suffix = "";
    let base = urlBase;

    // See if we're on a non-default locale
    if (locale && locale !== defaultLocale) {
        // Use a sub-domain, if one is requested
        /* istanbul ignore if */
        if (config.USE_I18N_SUBDOMAIN === "1") {
            if (base.indexOf(`://${locale}.`) < 0) {
                base = urlBase.replace("://", `://${locale}.`);
            }

        // Otherwise fall back to using a query string
        } else {
            if (path.indexOf(`lang=${locale}`) < 0) {
                const prefix = /\?/.test(path) ? "&" : "?";
                suffix = `${prefix}lang=${locale}`;
            }
        }
    }

    // Make sure we don't have an accidental // in the URL
    return base.replace(/\/$/, "") + path + suffix;
};

module.exports = {
    // Generate a URL given a path and a locale
    gen(locale, path) {
        return genURL(locale, config.BASE_URL, path);
    },

    // Generate a URL to a data file, given a path
    genData(filePath) {
        return genURL(null, config.BASE_DATA_URL, filePath);
    },

    // Generate a path to a data file, given a path
    genLocalFile(filePath) {
        return path.resolve(config.BASE_DATA_DIR, filePath);
    },
};

"use strict";

const i18n = require("i18n-abide");

const config = require("../lib/config");
const locales = require("../config/locales.json");
const defaultLocale = Object.keys(locales)[0];

module.exports = (app) => {
    app.use((req, res, next) => {
        // i18n-abide overwrites all the locals, so we need to save them
        // and restore them after it's done.
        res.tmpLocals = res.locals;
        next();
    });

    app.use(i18n.abide({
        supported_languages: Object.keys(locales),
        default_lang: defaultLocale,
        translation_directory: "translations",
        translation_type: "po",
    }));

    app.use((req, res, next) => {
        // Restore the old local properties and methods
        Object.assign(res.locals, res.tmpLocals);

        let locale = config.USE_I18N_SUBDOMAIN === "1" ?
            // Set the locale based upon the subdomain
            /* istanbul ignore else */
            (/\/\/(\w+)/.exec(req.url) || [])[0] :

            // Set the locale based upon the ?lang= query string
            req.query.lang;

        // Fall back to the default locale if one isn't given, or it's invalid
        if (!locales[locale]) {
            locale = defaultLocale;
        }

        res.locals.setLocale(locale);

        next();
    });
};

"use strict";

const i18n = require("i18n-abide");

const locales = require("../config/locales.json");

module.exports = (app) => {
    app.use((req, res, next) => {
        // i18n-abide overwrites all the locals, so we need to save them
        // and restore them after it's done.
        res.tmpLocals = res.locals;
        next();
    });

    app.use(i18n.abide({
        supported_languages: Object.keys(locales),
        default_lang: "en",
        translation_directory: "translations",
        translation_type: "po",
    }));

    app.use((req, res, next) => {
        // Restore the old local properties and methods
        Object.assign(res.locals, res.tmpLocals);

        // Set the locale based upon the ?lang= query string
        // TODO: Check sub-domain for language
        res.locals.setLocale(req.query.lang || "en");

        next();
    });
};

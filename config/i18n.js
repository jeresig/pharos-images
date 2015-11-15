var i18n = require("i18n-2");

const locales = require("../../data/locales.json");

const env = process.env.NODE_ENV || "development";

exports = function(app) {
    i18n.expressBind(app, {
        locales: Object.keys(locales),
        subdomain: true,
        query: env === "development"
    });
};
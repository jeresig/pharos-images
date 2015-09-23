
/*!
 * Module dependencies.
 */

var express = require("express");
var i18n = require("i18n-2");
var mongoStore = require("connect-mongo")(express);
var methodOverride = require("method-override");
var helpers = require("view-helpers");
var pkg = require("../package");
var flash = require("connect-flash");
var env = process.env.NODE_ENV || "development";
var swig = require("swig");
var path = require("path");
var rootPath = path.resolve(__dirname + "../..");

/*!
 * Expose
 */

module.exports = function(app, passport) {
    // Add basic auth for staging
    if (env === "staging") {
        app.use(express.basicAuth(function(user, pass) {
            return "username" === user & "password" === pass;
        }));

        app.use(function (req, res, next) {
            if (req.remoteUser && req.user && !req.user._id) {
                delete req.user;
            }
            next();
        });
    }

    var CDN = require("express-cdn")(app, {
        publicDir: rootPath + "/public",
        viewsDir: rootPath + "/app/views",
        extensions: [".swig"],
        domain: process.env.S3_STATIC_BUCKET,
        bucket: process.env.S3_STATIC_BUCKET,
        key: process.env.S3_KEY,
        secret: process.env.S3_SECRET,
        ssl: false,
        production: env === "production"
    });

    app.set("showStackError", true);

    // use express favicon
    app.use(express.favicon());

    app.use(express.static(rootPath + "/public"));
    app.use(express.logger("dev"));

    app.engine("swig", swig.renderFile)

    // views config
    app.set("views", rootPath + "/app/views");
    app.set("view engine", "swig");

    app.set("view cache", false);
    swig.setDefaults({ cache: false });

    // bodyParser should be above methodOverride
    //app.use(express.bodyParser());
    app.use(methodOverride());

    // cookieParser should be above session
    app.use(express.cookieParser());
    app.use(express.session({
        secret: pkg.name,
        store: new mongoStore({
            url: process.env.MONGODB_URL,
            collection: "sessions"
        })
    }));

    // Passport session
    app.use(passport.initialize());
    app.use(passport.session());

    // Flash messages
    app.use(flash());

    // expose pkg and node env to views
    app.use(function (req, res, next) {
        res.locals.pkg = pkg
        res.locals.env = env
        next();
    });

    // View helpers
    app.use(helpers(pkg.name));

    // adds CSRF support
    if (process.env.NODE_ENV !== "test") {
        app.use(express.csrf());

        app.use(function(req, res, next) {
            res.locals.csrf_token = req.csrfToken();
            next();
        });
    }
    // Supported locales
    app.localeNames = {
        en: "English",
        ja: "日本語",
        de: "Deutsch",
        es: "Español",
        fr: "Français",
        nl: "Nederlands",
        pt: "Português",
        zh: "中文"
    };

    app.locales = Object.keys(app.localeNames);

    i18n.expressBind(app, {
        locales: app.locales,
        subdomain: true,
        query: env === "development"
    });

    // Generate a URL given a path and a locale
    app.genURL = function(locale, path) {
        var base = locale === "en" || !locale || env === "development" ?
            app.baseURL() :
            app.baseURL().replace(/:\/\//, "://" + locale + ".");

        // Only use a query string in dev mode and if we're
        // on a non-default locale
        if (env === "development" && locale !== app.locales[0]) {
            path += (/\?/.test(path) ? "&" : "?") + "lang=" + locale;
        }

        return base + path;
    };

    // The base URL for all pages
    app.baseURL = function() {
        return process.env.BASE_URL ||
            "http://localhost:" + process.env.PORT;
    };

    // The base URL for storage
    app.baseDataURL = function() {
        return process.env.BASE_DATA_URL ||
            "http://localhost:" + process.env.PORT;
    };

    // Generate a data URL
    app.dataURL = function(source, type) {
        return app.baseDataURL() + source + "/" + (type || "");
    };

    app.use(function(req, res, next) {
        res.locals.SITE_NAME = process.env.SITE_NAME;

        res.locals.CDN = CDN(req, res);

        var otherLocale = function(req) {
            return req.i18n.getLocale() === "en" ? "ja" : "en";
        };

        res.locals.getLocales = function() {
            return app.locales;
        };

        res.locals.getLocaleName = function(locale) {
            return app.localeNames[locale];
        };

        res.locals.getSiteCategory = function() {
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
        };

        res.locals.getOtherURL = function(locale) {
            return app.genURL(locale, req.path);
        };

        res.locals.curLocale = function() {
            return req.i18n.getLocale();
        };

        res.locals.URL = function(path) {
            return path.getURL ?
                path.getURL(req.i18n.getLocale()) :
                app.genURL(req.i18n.getLocale(), path);
        };

        res.locals.fullName = function(item) {
            var locale = req.i18n.getLocale();
            return item.getFullName ?
                item.getFullName(locale) :
                locale === "ja" && item.kanji || item.name || item;
        };

        res.locals.shortName = function(item) {
            return item.getShortName(req.i18n.getLocale());
        };

        res.locals.getTitle = function(item) {
            return item.getTitle(req.i18n.getLocale());
        };

        res.locals.getDate = function(item) {
            return item.dateCreated ?
                res.locals.getDate(item.dateCreated) :
                (item.circa ? "ca. " : "") +
                    item.start + (item.end && item.end !== item.start ?
                    "-" + item.end : "");
        };

        // Format a number using commas
        // TODO: Handle locale here, as well
        res.locals.stringNum = function(num) {
            return (num || "").toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };

        next();
    });

    // routes should be at the last
    app.use(app.router);

    // custom error handler
    app.use(function (err, req, res, next) {
        if (err.message
            && (~err.message.indexOf("not found")
            || (~err.message.indexOf("Cast to ObjectId failed")))) {
            return next();
        }

        console.error(err.stack);
        res.status(500).render("500");
    })

    app.use(function (req, res, next) {
        res.status(404).render("404", { url: req.originalUrl });
    });

    // development specific stuff
    if (app.get("env") === "development" || app.get("env") === "staging") {
        app.locals.pretty = true;
    }
};

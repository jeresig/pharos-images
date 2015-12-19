"use strict";

const path = require("path");

const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const serveFavicon = require("serve-favicon");
const serveStatic = require("serve-static");
const morgan = require("morgan");
const session = require("express-session");
const mongoStore = require("connect-mongo")(session);

const swig = require("swig");

const pkg = require("../package");
const env = process.env.NODE_ENV || "development";

const viewMethods = require("./middlewares/view-methods");
const searchURL = require("./middlewares/search-url");

const rootPath = path.resolve(__dirname, "..");

module.exports = (core, app) => {
    // A basic logger for tracking who is accessing the service
    app.use(morgan("dev"));

    // Enable error handling and displaying of a 500 error page
    // when an exception is thrown
    app.set("showStackError", true);
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).render("500");
    });

    // Configure all the paths for serving the static content on the site
    app.use(serveFavicon(`${rootPath}/public/images/favicon.png`));
    app.use(serveStatic(`${rootPath}/public`));
    app.use("/data", serveStatic(`${rootPath}/data`));

    // Configure how the views are handled (with swig)
    app.engine("swig", swig.renderFile);
    app.set("views", `${rootPath}/views`);
    app.set("view engine", "swig");

    // Enable caching of the view files by Express, but only in production
    app.set("view cache", env === "production");
    swig.setDefaults({ cache: false });

    // Parses the contents of HTTP POST bodies, handling URL-encoded forms
    // and also JSON blobs
    app.use(bodyParser.urlencoded({
        extended: false,
    }));

    // Adds in support for overriding HTTP verbs to help
    // clients support DELETE and PUT
    app.use(methodOverride());

    // Parse cookies, which are then used by the session
    app.use(cookieParser());

    // Track user sessions and store them in a Mongodb data store
    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: pkg.name,
        store: new mongoStore({
            mongooseConnection: core.db.mongoose.connection,
            collection: "sessions",
        }),
    }));

    // Bring in the methods that will be available to the views
    app.use(viewMethods);
    app.use(searchURL(core, app));
};

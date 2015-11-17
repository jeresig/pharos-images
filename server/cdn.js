const path = require("path");

const expressCDN = require("express-cdn");

const env = process.env.NODE_ENV || "development";
const rootPath = path.resolve(__dirname, "../..");

module.exports = function(core, app) {
    const CDN = expressCDN(app, {
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

    app.use(function(req, res, next) {
        res.locals.CDN = CDN(req, res);
        next();
    });
};
"use strict";

const path = require("path");

const config = require("../lib/config");

const staticBucket = config.S3_STATIC_BUCKET;

module.exports = (app) => {
    let CDN = () => (path, opts) => {
        if (opts && opts.raw) {
            return path;
        }

        if (/\.css$/.test(path)) {
            return `<link rel="stylesheet" href="${path}"/>`;
        /* istanbul ignore else */
        } else if (/\.js$/.test(path)) {
            return `<script src="${path}"></script>`;
        }

        /* istanbul ignore next */
        throw new Error(`Unknown static file: ${path}`);
    };

    /* istanbul ignore if */
    if (staticBucket) {
        if (!config.S3_KEY) {
            console.error("ENV S3_KEY is undefined.");
            process.exit(1);
        }

        if (!config.S3_SECRET) {
            console.error("ENV S3_SECRET is undefined.");
            process.exit(1);
        }

        const expressCDN = require("express-cdn");
        const rootPath = path.resolve(__dirname, "../..");

        CDN = expressCDN(app, {
            publicDir: `${rootPath}/public`,
            viewsDir: `${rootPath}/app/views`,
            extensions: [".swig"],
            domain: staticBucket,
            bucket: staticBucket,
            key: config.S3_KEY,
            secret: config.S3_SECRET,
            ssl: false,
            production: config.NODE_ENV === "production",
        });
    }

    app.use((req, res, next) => {
        res.locals.CDN = CDN(req, res);
        next();
    });
};

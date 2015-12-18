"use strict";

const path = require("path");

const staticBucket = process.env.S3_STATIC_BUCKET;
const env = process.env.NODE_ENV || "development";

module.exports = (core, app) => {
    let CDN = (req, res) => (path, opts) => {
        if (opts && opts.raw) {
            return path;
        }

        if (/\.css$/.test(path)) {
            return `<link rel="stylesheet" href="${path}"/>`;
        } else if (/\.js$/.test(path)) {
            return `<script src="${path}"></script>`;
        }

        throw new Error(`Unknown static file: ${path}`);
    };

    if (staticBucket) {
        if (!process.env.S3_KEY) {
            throw new Error("ENV S3_KEY is undefined.");
        }

        if (!process.env.S3_SECRET) {
            throw new Error("ENV S3_SECRET is undefined.");
        }

        const expressCDN = require("express-cdn");
        const rootPath = path.resolve(__dirname, "../..");

        CDN = expressCDN(app, {
            publicDir: `${rootPath}/public`,
            viewsDir: `${rootPath}/app/views`,
            extensions: [".swig"],
            domain: staticBucket,
            bucket: staticBucket,
            key: process.env.S3_KEY,
            secret: process.env.S3_SECRET,
            ssl: false,
            production: env === "production",
        });
    }

    app.use((req, res, next) => {
        res.locals.CDN = CDN(req, res);
        next();
    });
};

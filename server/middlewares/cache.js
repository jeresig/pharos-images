"use strict";

const env = process.env.NODE_ENV;

// Utility method of setting the cache header on a request
// Used as a piece of Express middleware
module.exports = (hours) => (req, res, next) => {
    /* istanbul ignore if */
    if (env === "production") {
        res.setHeader("Cache-Control", `public, max-age=${hours * 3600}`);
    }
    next();
};

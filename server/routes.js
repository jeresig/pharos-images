"use strict";

const cache = require("./middlewares/cache");

module.exports = function(core, app) {
    const artworks = require("../logic/artworks")(core, app);
    const uploads = require("../logic/uploads")(core, app);
    const home = require("../logic/home")(core, app);
    const sitemaps = require("../logic/sitemaps")(core, app);

    app.get("/search", cache(1), artworks.search);
    app.get("/artworks/:source/:artworkName", artworks.show);
    app.get("/type/:type", cache(1), artworks.byType);
    app.get("/source/:source", cache(1), artworks.bySource);

    app.param("artworkName", artworks.load);

    app.get("/uploads/:upload", uploads.show);
    app.post("/upload", uploads.searchUpload);

    app.get("/sitemap.xml", sitemaps.index);
    app.get("/sitemap-sources.xml", sitemaps.sources);
    app.get("/sitemap-artists.xml", sitemaps.artists);
    app.get("/sitemap-search-:start.xml", sitemaps.search);

    app.get("/", cache(1), home.index);

    app.use((req, res, next) => {
        res.status(404).render("404", {
            url: req.originalUrl,
        });
    });
};

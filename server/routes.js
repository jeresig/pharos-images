const cache = require("./middlewares/cache");

const env = process.env.NODE_ENV || "development";

module.exports = function(core, app) {
    const artists = require("../logic/artists")(core, app);
    const artworks = require("../logic/artworks")(core, app);
    const uploads = require("../logic/uploads")(core, app);
    const sources = require("../logic/sources")(core, app);
    const home = require("../logic/home")(core, app);
    const sitemaps = require("../logic/sitemaps")(core, app);

    app.get("/artists", cache(1), artists.index);
    app.get("/artists/:slug", artists.oldSlugRedirect);
    app.get("/artists/:slug/:artistId", cache(1), artists.show);

    app.param("artistId", artists.load);

    app.get("/search", cache(1), artworks.search);
    app.get("/artworks/:sourceId/:artworkName", artworks.show);

    app.param("artworkName", artworks.load);

    app.get("/uploads/:uploadId", uploads.show);
    app.post("/upload", uploads.searchUpload);

    app.param("uploadId", uploads.load);

    app.get("/sources", cache(1), sources.index);
    app.get("/source/:sourceId", cache(12), sources.show);

    app.param("sourceId", sources.load);

    app.get("/sitemap.xml", sitemaps.index);
    app.get("/sitemap-sources.xml", sitemaps.sources);
    app.get("/sitemap-artists.xml", sitemaps.artists);
    app.get("/sitemap-search-:start.xml", sitemaps.search);

    app.get("/about", cache(1), home.about);
    app.get("/", cache(1), home.index);

    app.use((req, res, next) => {
        res.status(404).render("404", {
            url: req.originalUrl
        });
    });
};
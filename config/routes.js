var env = process.env.NODE_ENV || "development";

var auth = require("./middlewares/authorization");

var extractedartistAuth = [
    auth.requiresLogin
];

var artistAuth = [
    auth.requiresLogin
];

var imageAuth = [
    auth.requiresLogin
];

var passportOptions = {
    failureFlash: "Invalid email or password.",
    failureRedirect: "/login"
};

module.exports = function(app, passport, ukiyoe) {
    var users = require("../app/controllers/users")(ukiyoe, app);
    var bios = require("../app/controllers/bios")(ukiyoe, app);
    var artists = require("../app/controllers/artists")(ukiyoe, app);
    //var images = require("../app/controllers/images")(ukiyoe, app);
    var artworks = require("../app/controllers/artworks")(ukiyoe, app);
    var uploads = require("../app/controllers/uploads")(ukiyoe, app);
    var sources = require("../app/controllers/sources")(ukiyoe, app);
    var home = require("../app/controllers/home")(ukiyoe, app);
    var sitemaps = require("../app/controllers/sitemaps")(ukiyoe, app);

    // Utility method of setting the cache header on a request
    // Used as a piece of Express middleware
    var cache = function(hours) {
        return function(req, res, next) {
            if (env === "production") {
                res.setHeader("Cache-Control", "public, max-age=" + (hours * 3600));
            }
            next();
        };
    };

    /*
    app.get("/login", users.login);
    app.get("/signup", users.signup);
    app.get("/logout", users.logout);
    app.post("/users", users.create);
    app.post("/users/session", passport.authenticate("local", passportOptions),
        users.session);
    app.get("/users/:userId", users.show);

    app.param("userId", users.user);
    */

    /*
    app.get("/bios", bios.index);
    app.get("/bios/new", auth.requiresLogin, bios.new);
    app.post("/bios", auth.requiresLogin, bios.create);
    app.get("/bios/:bioId", bios.show);
    app.get("/bios/:bioId/edit", extractedartistAuth, bios.edit);
    app.put("/bios/:bioId", extractedartistAuth, bios.update);
    app.del("/bios/:bioId", extractedartistAuth, bios.destroy);

    app.param("bioId", bios.load);
    */

    app.get("/artists", cache(1), artists.index);
    //app.get("/artists/search", artists.search);
    //app.get("/artists/new", auth.requiresLogin, artists.new);
    //app.post("/artists", auth.requiresLogin, artists.create);
    app.get("/artists/:slug", artists.oldSlugRedirect);
    app.get("/artists/:slug/:artistId", cache(1), artists.show);
    //app.get("/artists/:artistId/edit", artistAuth, artists.edit);
    //app.put("/artists/:artistId", artistAuth, artists.update);
    //app.del("/artists/:artistId", artistAuth, artists.destroy);

    app.param("artistId", artists.load);

    //app.get("/images", images.index);
    app.get("/search", cache(1), artworks.search);
    //app.get("/images/new", auth.requiresLogin, images.new);
    //app.post("/images", auth.requiresLogin, images.create);
    app.get("/artworks/:sourceId/:artworkName", artworks.show);
    //app.get("/images/:imageId/edit", imageAuth, images.edit);
    //app.put("/images/:imageId", imageAuth, images.update);
    //app.del("/images/:imageId", imageAuth, images.destroy);

    app.param("artworkName", artworks.load);

    //app.get("/artworks/:sourceId/:artworkName", artworks.show);
    //app.param("artworkName", artworks.load);

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
};

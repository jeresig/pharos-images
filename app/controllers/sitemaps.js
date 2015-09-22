module.exports = function(core, app) {

var Artwork = core.db.model("Artwork");
var Source = core.db.model("Source");
var Artist = core.db.model("Artist");

var numPerMap = 1000;

var renderSitemap = function(res, sites) {
    res.header("Content-Type", "application/xml");
    res.render("sitemaps/show", {
        sites: sites
    });
};

return {
    index: function(req, res) {
        Artwork.count().exec(function(err, total) {
            var sitemaps = [
                { url: app.genURL(req.i18n.getLocale(),
                    "/sitemap-sources.xml") },
                {url: app.genURL(req.i18n.getLocale(),
                    "/sitemap-artists.xml") }
            ];

            for ( var i = 0; i < total; i += numPerMap ) {
                sitemaps.push({
                    url: app.genURL(req.i18n.getLocale(),
                        "/sitemap-search-" + i + ".xml")
                });
            }

            res.header("Content-Type", "application/xml");
            res.render("sitemaps/index", {
                sitemaps: sitemaps
            });
        });
    },

    search: function(req, res) {
        Artwork.find().limit(numPerMap).skip(req.params.start).exec(function(err, images) {
            var sites = images.map(function(item) {
                return {
                    url: item.getURL(req.i18n.getLocale()),
                    image: item.file
                };
            });

            renderSitemap(res, sites);
        });
    },

    sources: function(req, res) {
        Source.find({count: {$gt: 0}}).exec(function(err, sources) {
            var sites = sources.map(function(source) {
                return {
                    url: source.getURL(req.i18n.getLocale())
                };
            });

            // Add in the Index Page
            sites.push({
                url: app.genURL(req.i18n.getLocale(), "/")
            });

            // Add in the Sources Page
            sites.push({
                url: app.genURL(req.i18n.getLocale(), "/sources")
            });

            // Add in the About Page
            sites.push({
                url: app.genURL(req.i18n.getLocale(), "/about")
            });

            renderSitemap(res, sites);
        });
    },

    artists: function(req, res) {
        Artist.find({printCount: {$gt: 0}}).exec(function(err, artists) {
            var sites = artists.map(function(artist) {
                return {
                    url: artist.getURL(req.i18n.getLocale())
                };
            });

            renderSitemap(res, sites);
        });
    }
};

};
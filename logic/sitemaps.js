"use strict";

module.exports = function(core, app) {
    const Artwork = core.db.model("Artwork");
    const Source = core.db.model("Source");
    const Artist = core.db.model("Artist");

    const numPerMap = 1000;

    const renderSitemap = (res, sites) => {
        res.header("Content-Type", "application/xml");
        res.render("sitemaps/show", {
            sites: sites
        });
    };

    return {
        index(req, res) {
            Artwork.count().exec((err, total) => {
                const sitemaps = [
                    {url: core.urls.gen(req.i18n.getLocale(),
                        "/sitemap-sources.xml") },
                    {url: core.urls.gen(req.i18n.getLocale(),
                        "/sitemap-artists.xml") }
                ];

                for (let i = 0; i < total; i += numPerMap) {
                    sitemaps.push({
                        url: core.urls.gen(req.i18n.getLocale(),
                            `/sitemap-search-${i}.xml`)
                    });
                }

                res.header("Content-Type", "application/xml");
                res.render("sitemaps/index", {
                    sitemaps: sitemaps
                });
            });
        },

        search: function(req, res) {
            Artwork.find()
                .limit(numPerMap)
                .skip(req.params.start)
                .exec((err, images) => {
                    const sites = images.map((item) => ({
                        url: item.getURL(req.i18n.getLocale()),
                        image: item.file
                    }));

                    renderSitemap(res, sites);
                });
        },

        sources: function(req, res) {
            Source.find({count: {$gt: 0}}).exec((err, sources) => {
                const sites = sources.map((source) => ({
                    url: source.getURL(req.i18n.getLocale())
                }));

                // Add in the Index Page
                sites.push({
                    url: core.urls.gen(req.i18n.getLocale(), "/")
                });

                // Add in the Sources Page
                sites.push({
                    url: core.urls.gen(req.i18n.getLocale(), "/sources")
                });

                // Add in the About Page
                sites.push({
                    url: core.urls.gen(req.i18n.getLocale(), "/about")
                });

                renderSitemap(res, sites);
            });
        },

        artists: function(req, res) {
            Artist.find({printCount: {$gt: 0}}).exec((err, artists) => {
                const sites = artists.map((artist) ({
                    url: artist.getURL(req.i18n.getLocale())
                }));

                renderSitemap(res, sites);
            });
        }
    };
};
"use strict";

module.exports = function(core, app) {
    const Artwork = core.models.Artwork;
    const Source = core.models.Source;
    const Artist = core.models.Artist;

    const numPerMap = 1000;

    const renderSitemap = (res, sites) => {
        res.header("Content-Type", "application/xml");
        res.render("sitemaps/show", {
            sites: sites,
        });
    };

    return {
        index(req, res) {
            Artwork.count().exec((err, total) => {
                const sitemaps = [
                    {url: core.urls.gen(res.locals.lang,
                        "/sitemap-sources.xml") },
                    {url: core.urls.gen(res.locals.lang,
                        "/sitemap-artists.xml") },
                ];

                for (let i = 0; i < total; i += numPerMap) {
                    sitemaps.push({
                        url: core.urls.gen(res.locals.lang,
                            `/sitemap-search-${i}.xml`),
                    });
                }

                res.header("Content-Type", "application/xml");
                res.render("sitemaps/index", {
                    sitemaps: sitemaps,
                });
            });
        },

        search: function(req, res) {
            Artwork.find()
                .limit(numPerMap)
                .skip(req.params.start)
                .exec((err, images) => {
                    const sites = images.map((item) => ({
                        url: item.getURL(res.locals.lang),
                        image: item.file,
                    }));

                    renderSitemap(res, sites);
                });
        },

        sources: function(req, res) {
            Source.find({}).exec((err, sources) => {
                const sites = sources.map((source) => ({
                    url: source.getURL(res.locals.lang),
                }));

                // Add in the Index Page
                sites.push({
                    url: core.urls.gen(res.locals.lang, "/"),
                });

                renderSitemap(res, sites);
            });
        },

        artists: function(req, res) {
            Artist.find({}).exec((err, artists) => {
                const sites = artists.map((artist) => ({
                    url: artist.getURL(res.locals.lang),
                }));

                renderSitemap(res, sites);
            });
        },
    };
};

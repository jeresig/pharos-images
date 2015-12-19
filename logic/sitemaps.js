"use strict";

module.exports = function(core, app) {
    const Artwork = core.models.Artwork;
    const Source = core.models.Source;
    const Artist = core.models.Artist;

    const numPerMap = 1000;

    const renderSitemap = (res, sites) => {
        res.header("Content-Type", "application/xml");
        res.render("sitemap-results", {
            sites: sites,
        });
    };

    return {
        index(req, res) {
            Artwork.count().exec((err, total) => {
                const sitemaps = [
                    {url: core.urls.gen(req.lang, "/sitemap-sources.xml") },
                    {url: core.urls.gen(req.lang, "/sitemap-artists.xml") },
                ];

                for (let i = 0; i < total; i += numPerMap) {
                    sitemaps.push({
                        url: core.urls.gen(req.lang,
                            `/sitemap-search-${i}.xml`),
                    });
                }

                res.header("Content-Type", "application/xml");
                res.render("sitemap-index", {
                    sitemaps: sitemaps,
                });
            });
        },

        search(req, res) {
            Artwork.find()
                .limit(numPerMap)
                .skip(req.params.start)
                .exec((err, images) => {
                    const sites = images.map((item) => ({
                        url: item.getURL(req.lang),
                        image: item.file,
                    }));

                    renderSitemap(res, sites);
                });
        },

        sources(req, res) {
            Source.find({}).exec((err, sources) => {
                const sites = sources.map((source) => ({
                    url: source.getURL(req.lang),
                }));

                // Add in the Index Page
                sites.push({
                    url: core.urls.gen(req.lang, "/"),
                });

                renderSitemap(res, sites);
            });
        },

        artists(req, res) {
            Artist.find({}).exec((err, artists) => {
                const sites = artists.map((artist) => ({
                    url: artist.getURL(req.lang),
                }));

                renderSitemap(res, sites);
            });
        },

        routes() {
            app.get("/sitemap.xml", this.index);
            app.get("/sitemap-sources.xml", this.sources);
            app.get("/sitemap-artists.xml", this.artists);
            app.get("/sitemap-search-:start.xml", this.search);
        },
    };
};

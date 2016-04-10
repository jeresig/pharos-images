"use strict";

const NUM_PER_SITEMAP = 1000;

module.exports = function(core, app) {
    const Artwork = core.models.Artwork;

    return {
        index(req, res) {
            Artwork.count({}, (err, total) => {
                const sitemaps = [];

                for (let i = 0; i < total; i += NUM_PER_SITEMAP) {
                    sitemaps.push({
                        url: core.urls.gen(req.lang,
                            `/sitemap-search-${i}.xml`),
                    });
                }

                res.header("Content-Type", "application/xml");
                res.render("sitemap-index", {sitemaps});
            });
        },

        search(req, res) {
            // Query for the artworks in Elasticsearch
            Artwork.search({
                bool: {
                    must: [
                        {
                            query_string: {
                                query: "*",
                            },
                        },
                    ],
                },
            }, {
                size: NUM_PER_SITEMAP,
                from: req.params.start,
            }, (err, results) => {
                /* istanbul ignore if */
                if (err) {
                    return res.status(500).render("error", {
                        title: err.message,
                    });
                }

                const urls = results.hits.hits.map((item) =>
                    Artwork.getURLFromID(req.lang, item._id));

                res.header("Content-Type", "application/xml");
                res.render("sitemap-results", {urls});
            });
        },

        routes() {
            app.get("/sitemap.xml", this.index);
            app.get("/sitemap-search-:start.xml", this.search);
        },
    };
};

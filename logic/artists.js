const async = require("async");

module.exports = function(core, app) {
    const Artist = core.db.model("Artist");

    Artist.prototype.getURL = (locale) => {
        return app.genURL(locale, "/artists/" + (this.slug || "artist") +
            "/" + this._id);
    };

    return {
        load(req, res, next, id) {
            Artist.findById(id, (err, artist) => {
                if (err) {
                    return next(err);
                }
                if (!artist) {
                    return next(new Error("not found"));
                }
                if (req.params.slug && req.params.slug !== artist.slug) {
                    res.redirect(301, artist.getURL(req.i18n.getLocale()));
                    return;
                }
                req.artist = artist;
                next();
            });
        },

        oldSlugRedirect(req, res, next) {
            Artist.findOne({slug: req.params.slug}, (err, artist) => {
                if (err) {
                    return next(err);
                }

                if (!artist) {
                    // TODO: Maybe do an artist search instead?
                    res.redirect(301, app.genURL(
                        req.i18n.getLocale(),
                        "/search?q=" + encodeURIComponent(
                            req.params.slug.replace(/-/g, " "))
                    ));
                } else {
                    res.redirect(301, artist.getURL());
                }
            });
        },

        search(req, res) {
            const perPage = 10;

            const q = req.params.q || "";
            // TODO: Fix kanji searching
            const query = q.trim().split(/\s+/)
                .map((name) => name ? name + "*" : "")
                .filter((name) => !!name)
                .join(" AND ");

            const options = {
                query: query,
                size: perPage
            };

            Artist.search(options, {hydrate: true}, (err, artists) => {
                if (err) {
                    console.error(err)
                    return res.render("500");
                }

                const results = {
                    matches: []
                };

                artists.hits.forEach((artist) => {
                    // TODO: Figure out locale
                    results.matches.push({
                        id: artist._id,
                        text: artist.name.name
                    });
                });

                res.send(200, results);
            });
        },

        searchByName(req, res) {
            const query = req.params.q || "";

            Artist.searchByName(query, (err, results) => {
                if (err) {
                    return res.render("500");
                }

                res.send(200, results);
            });
        },

        index(req, res) {
            const page = (req.params.page > 0 ? req.params.page : 1) - 1;
            const perPage = 100;
            const options = {
                query: "Utagawa",
                size: perPage,
                from: page * perPage
            };

            Artist.search(options, {hydrate: true, hydrateOptions: {populate: "bios"}}, function(err, results){
                if (err) {
                    return res.render("500");
                }

                res.render("artists/index", {
                    title: "Artists",
                    artists: results.hits,
                    page: page + 1,
                    pages: Math.ceil(results.total / perPage)
                });
            });
        },

        show(req, res) {
            req.artist.populate("bios", () => {
                // Ugh, why doesn't this work?
                // .populate("bios.source")
                async.each(req.artist.bios, (bio, callback) => {
                    bio.populate("source", callback);
                }, () => {
                    app.imageSearch(req, res, {
                        term: {
                            "artists.artist": req.artist._id.toString()
                        },
                    }, {
                        title: req.artist.getFullName(req.i18n.getLocale()),
                        desc: req.i18n.__("Japanese Woodblock prints by %s.",
                            req.artist.getFullName(req.i18n.getLocale())),
                        artist: req.artist,
                        bio: req.artist.bios.sort((a, b) => {
                            return (b.bio ? b.bio.length : 0) - (a.bio ? a.bio.length : 0);
                        })[0].bio
                    });
                });
            });
        }
    };
};
var async = require("async");

module.exports = function(core, app) {

var Artist = core.db.model("Artist");
var exports = {};

Artist.prototype.getURL = function(locale) {
    return app.genURL(locale, "/artists/" + (this.slug || "artist") +
        "/" + this._id);
};

exports.load = function(req, res, next, id) {
    Artist.findById(id, function(err, artist) {
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
};

exports.oldSlugRedirect = function(req, res, next) {
    Artist.findOne({slug: req.params.slug}, function(err, artist) {
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
};

/**
 * Search
 */

exports.search = function(req, res) {
    var perPage = 10;

    var q = req.params.q || "";
    // TODO: Fix kanji searching
    var query = q.trim().split(/\s+/).map(function(name) {
        return name ? name + "*" : "";
    }).filter(function(name) {
        return !!name;
    }).join(" AND ");

    var options = {
        query: query,
        size: perPage
    };

    Artist.search(options, {hydrate: true}, function(err, artists){
        if (err) {
            console.error(err)
            return res.render("500");
        }

        var results = {
            matches: []
        };

        artists.hits.forEach(function(artist) {
            // TODO: Figure out locale
            results.matches.push({
                id: artist._id,
                text: artist.name.name
            });
        });

        res.send(200, results);
    });
};

exports.searchByName = function(req, res) {
    var query = req.params.q || "";

    Artist.searchByName(query, function(err, results) {
        if (err) {
            return res.render("500");
        }

        res.send(200, results);
    });
};

/**
 * List
 */

exports.index = function(req, res) {
    var page = (req.params.page > 0 ? req.params.page : 1) - 1;
    var perPage = 100;
    var options = {
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
};

/**
 * Show
 */

exports.show = function(req, res) {
    req.artist.populate("bios", function() {
        // Ugh, why doesn't this work?
        // .populate("bios.source")
        async.each(req.artist.bios, function(bio, callback) {
            bio.populate("source", callback);
        }, function() {
            app.imageSearch(req, res, {
                term: {
                    "artists.artist": req.artist._id.toString()
                },
            }, {
                title: req.artist.getFullName(req.i18n.getLocale()),
                desc: req.i18n.__("Japanese Woodblock prints by %s.",
                    req.artist.getFullName(req.i18n.getLocale())),
                artist: req.artist,
                bio: req.artist.bios.sort(function(a, b) {
                    return (b.bio ? b.bio.length : 0) - (a.bio ? a.bio.length : 0);
                })[0].bio
            });
        });
    });
};

return exports;
};

/**
 * Module dependencies.
 */
module.exports = function(ukiyoe) {

var Bio = ukiyoe.db.model("Bio"),
    utils = require("../../lib/utils"),
    _ = require("lodash"),
    exports = {};

/**
 * Load
 */

exports.load = function(req, res, next, id) {
    Bio.load(id, function(err, bio) {
        if (err) {
            return next(err);
        }
        if (!bio) {
            return next(new Error("not found"));
        }
        req.bio = bio;
        next();
    });
};

/**
 * List
 */

exports.index = function(req, res) {
    var page = (req.param("page") > 0 ? req.param("page") : 1) - 1;
    var perPage = 30;
    var options = {
        query: "Hiroshige",
        size: perPage,
        from: page * perPage
    };

    Bio.search(options, {hydrate: true}, function(err, results){
        if (err) {
            return res.render("500");
        }

        res.render("bios/index", {
            title: "Bios",
            bios: results.hits,
            page: page + 1,
            pages: Math.ceil(results.total / perPage)
        });
    });
};

/**
 * New bio
 */

exports.new = function(req, res) {
    res.render("bios/new", {
        title: "New Bio",
        bio: new Bio({})
    });
};

/**
 * Create an bio
 */

exports.create = function(req, res) {
    var bio = new Bio(req.body);
    bio.user = req.user;

    bio.save(function(err) {
        if (!err) {
            req.flash("success", "Successfully created bio!");
            return res.redirect("/bios/" + bio._id);
        }

        res.render("bios/new", {
            title: "New Bio",
            bio: bio,
            errors: utils.errors(err.errors || err)
        });
    });
};

/**
 * Edit an bio
 */

exports.edit = function(req, res) {
    res.render("bios/edit", {
        title: "Edit " + req.bio.title,
        bio: req.bio
    });
};

/**
 * Update bio
 */

exports.update = function(req, res) {
    var bio = req.bio;
    bio = _.extend(bio, req.body);

    bio.save(function(err) {
        if (!err) {
            return res.redirect("/bios/" + bio._id);
        }

        res.render("bios/edit", {
            title: "Edit Bio",
            bio: bio,
            errors: err.errors
        });
    });
};

/**
 * Show
 */

exports.show = function(req, res) {
    res.render("bios/show", {
        title: req.bio.title,
        bio: req.bio
    });
};

/**
 * Delete an bio
 */

exports.destroy = function(req, res) {
    var bio = req.bio;
    bio.remove(function(err) {
        req.flash("info", "Deleted successfully")
        res.redirect("/bios")
    });
};

return exports;
};
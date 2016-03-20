"use strict";

const passport = require("passport");

module.exports = function(core, app) {
    return {
        login(req, res) {
            res.render("login", {});
        },

        loginRedirect(req, res, next) {
            passport.authenticate("local", (err, user) => {
                if (!user) {
                    return res.redirect(core.urls.gen(req.lang, "/login"));
                }

                req.login(user, () => {
                    const redirectTo = req.session.redirectTo ||
                        core.urls.gen(req.lang, "/");
                    delete req.session.redirectTo;
                    res.redirect(redirectTo);
                });
            })(req, res, next);
        },

        logout(req, res) {
            req.logout();
            res.redirect(core.urls.gen(req.lang, "/"));
        },

        routes() {
            app.get("/login", this.login);
            app.post("/login", this.loginRedirect);
            app.get("/logout", this.logout);
        },
    };
};

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

module.exports = function(core, app) {
    const User = core.db.model("User");

    // serialize sessions
    passport.serializeUser((user, callback) => {
        callback(null, user.id);
    });

    passport.deserializeUser((id, callback) => {
        User.findOne({_id: id}, callback);
    });

    // use local strategy
    passport.use(new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        (email, password, callback) => {
            User.findOne({ email: email }).exec(function(err, user) {
                if (err) {
                    return callback(err);
                }
                if (!user) {
                    return callback(null, false, { message: "Unknown user" });
                }
                if (!user.authenticate(password)) {
                    return callback(null, false, { message: "Invalid password" });
                }
                return callback(null, user);
            });
        }
    ));

    // Initialize Passport and the Passport session, which allows users to
    // login to the site.
    app.use(passport.initialize());
    app.use(passport.session());
};

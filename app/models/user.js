/**
 * Module dependencies.
 */
module.exports = function(ukiyoe) {

var crypto = require("crypto");

/**
 * User Schema
 */

var UserSchema = new ukiyoe.db.schema({
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    hashed_password: { type: String, default: "" },
    salt: { type: String, default: "" },
    authToken: { type: String, default: "" }
})

/**
 * Virtuals
 */

UserSchema
    .virtual("password")
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });

/**
 * Validations
 */

var validatePresenceOf = function(value) {
    return value && value.length;
};

UserSchema.path("name").validate(validatePresenceOf, "Name cannot be blank");

UserSchema.path("email").validate(validatePresenceOf, "Email cannot be blank");

UserSchema.path("email").validate(function(email, fn) {
    var User = ukiyoe.db.model("User");

    // Check only when it is a new user or when email field is modified
    if (this.isNew || this.isModified("email")) {
        User.find({ email: email }).exec(function(err, users) {
            fn(!err && users.length === 0);
        });
    } else {
        fn(true);
    }
}, "Email already exists");

UserSchema.path("hashed_password").validate(validatePresenceOf,
    "Password cannot be blank");

/**
 * Pre-save hook
 */

UserSchema.pre("save", function(next) {
    if (!this.isNew) {
        return next();
    }

    if (!validatePresenceOf(this.password)) {
        next(new Error("Invalid password"));
    } else {
        next();
    }
});

/**
 * Methods
 */

UserSchema.methods = {

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */

    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */

    makeSalt: function() {
        return Math.round((new Date().valueOf() * Math.random())).toString();
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */

    encryptPassword: function(password) {
        if (!password) {
            return "";
        }

        try {
            return encrypted = crypto.createHmac("sha1", this.salt)
                .update(password).digest("hex");
        } catch (err) {
            return "";
        }
    }
};

ukiyoe.db.model("User", UserSchema);

};

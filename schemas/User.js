"use strict";

const bcrypt = require("bcrypt");

module.exports = (core) => {
    const User = new core.db.schema({
        _id: core.db.schema.Types.ObjectId,
        name: {type: String, default: ""},
        email: {type: String, default: ""},
        hashed_password: {type: String, default: ""},
        salt: {type: String, default: ""},
        authToken: {type: String, default: ""},
    });

    User
        .virtual("password")
        .set(function(password) {
            this._password = password;
            this.salt = this.makeSalt();
            this.hashed_password = this.encryptPassword(password);
        })
        .get(function() {
            return this._password;
        });

    const validatePresenceOf = (value) => value && value.length;

    // TODO(jeresig): i18n the error messages

    User.path("name").validate(validatePresenceOf,
        "Name cannot be blank");

    User.path("email").validate(validatePresenceOf,
        "Email cannot be blank");

    User.path("email").validate(function(email, callback) {
        const User = core.models.User;

        // Check only when it is a new user or when email field is modified
        if (this.isNew || this.isModified("email")) {
            User.find({email: email}).exec((err, users) => {
                callback(!err && users.length === 0);
            });
        } else {
            callback(true);
        }
    }, "Email already exists");

    User.path("hashed_password").validate(validatePresenceOf,
        "Password cannot be blank");

    User.pre("save", function(next) {
        if (!this.isNew) {
            return next();
        }

        if (!validatePresenceOf(this.password)) {
            next(new Error("Invalid password"));
        } else {
            next();
        }
    });

    User.methods = {
        authenticate(plainText) {
            return this.encryptPassword(plainText) === this.hashed_password;
        },

        makeSalt() {
            return bcrypt.genSaltSync(10);
        },

        encryptPassword(password) {
            if (!password) {
                return "";
            }

            try {
                return bcrypt.hashSync(password, this.salt);
            } catch (err) {
                return "";
            }
        },
    };

    return User;
};

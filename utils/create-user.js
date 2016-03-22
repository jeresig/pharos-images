"use strict";

const rl = require("readline-sync");
const genPassword = require("password-generator");

const core = require("../core");

core.init(() => {
    const email = rl.question("Email: ");
    const password = rl.question("Password [auto-gen]: ", {
        defaultInput: genPassword(),
        hideEchoBack: true,
    });
    const source = rl.question("Source Admin: ");

    const user = new core.models.User({
        email,
        password,
        sourceAdmin: source ? [source] : [],
    });

    user.save((err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Created User!");
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
        }

        process.exit();
    });
});

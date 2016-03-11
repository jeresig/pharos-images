"use strict";

require("./init").init((err) => {
    if (err) {
        console.error(err);
    } else {
        console.log("STARTED");
    }
});

"use strict";

const tap = require("tap");
const request = require("request");

require("../init");

tap.test("uploadData: Source not found", (t) => {
    const url = "http://localhost:3000/source/foo/upload-data";
    const formData = {};
    request.post({url, formData}, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 404);
        t.end();
    });
});

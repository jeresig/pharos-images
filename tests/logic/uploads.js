"use strict";

const fs = require("fs");
const path = require("path");

const tap = require("tap");
const request = require("request").defaults({jar: true});

require("../init");

tap.test("Upload New Image", (t) => {
    const url = "http://localhost:3000/file-upload";
    const file = "bar.jpg";
    const formData = {
        file: {
            value: fs.createReadStream(path.resolve("testData", file)),
            options: {
                filename: file,
            },
        },
    };
    request.post({
        url,
        formData,
    }, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 302);
        t.match(res.headers.location,
            "http://localhost:3000/uploads/2508884691");
        t.end();
    });
});

tap.test("Upload Existing Image", (t) => {
    const url = "http://localhost:3000/file-upload";
    const file = "foo.jpg";
    const formData = {
        file: {
            value: fs.createReadStream(path.resolve("testData", file)),
            options: {
                filename: file,
            },
        },
    };
    request.post({
        url,
        formData,
    }, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 302);
        t.match(res.headers.location,
            "http://localhost:3000/uploads/4266906334");
        t.end();
    });
});

tap.test("Upload Corrupted Image", (t) => {
    const url = "http://localhost:3000/file-upload";
    const file = "corrupted.jpg";
    const formData = {
        file: {
            value: fs.createReadStream(path.resolve("testData", file)),
            options: {
                filename: file,
            },
        },
    };
    request.post({
        url,
        formData,
    }, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 500);
        t.end();
    });
});

tap.test("Upload No Image", (t) => {
    const url = "http://localhost:3000/file-upload";
    const formData = {};
    request.post({
        url,
        formData,
    }, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 500);
        t.end();
    });
});

tap.test("View Upload", (t) => {
    const url = "http://localhost:3000/uploads/4266906334";
    request.get({
        url,
    }, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 200);
        t.end();
    });
});

tap.test("View Missing Upload", (t) => {
    const url = "http://localhost:3000/uploads/foo";
    request.get({
        url,
    }, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 404);
        t.end();
    });
});

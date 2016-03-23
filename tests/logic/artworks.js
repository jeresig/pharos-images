"use strict";

const tap = require("tap");
const request = require("request");

require("../init");

tap.test("Search", (t) => {
    const url = "http://localhost:3000/search";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 200);
        t.end();
    });
});

tap.test("By Type", (t) => {
    const url = "http://localhost:3000/type/painting";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 200);
        t.end();
    });
});

tap.test("By Type Missing", (t) => {
    const url = "http://localhost:3000/type/foo";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 404);
        t.end();
    });
});

tap.test("By Source", (t) => {
    const url = "http://localhost:3000/source/test";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 200);
        t.end();
    });
});

tap.test("By Source Missing", (t) => {
    const url = "http://localhost:3000/source/foo";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 404);
        t.end();
    });
});

tap.test("Artwork", (t) => {
    const url = "http://localhost:3000/artworks/test/1234";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 200);
        t.end();
    });
});

tap.test("Artwork Compare", (t) => {
    const url = "http://localhost:3000/artworks/test/1234?compare=1";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 200);
        t.end();
    });
});

tap.test("Artwork Missing", (t) => {
    const url = "http://localhost:3000/artworks/test/foo";
    request.get(url, (err, res) => {
        t.error(err, "Error should be empty.");
        t.equal(res.statusCode, 404);
        t.end();
    });
});

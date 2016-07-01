"use strict";

const tap = require("tap");

require("../../init");

const paramFilter = require("../../../logic/shared/param-filter");

tap.test("paramFilter - primary", {autoend: true}, (t) => {
    const req = {
        query: {
            filter: "test",
        },
    };

    t.same(paramFilter(req), {
        all: {filter: "test"},
        primary: ["filter"],
        secondary: {},
    });
});

tap.test("paramFilter - secondary", {autoend: true}, (t) => {
    const req = {
        query: {
            filter: "test",
            start: 0,
        },
    };

    t.same(paramFilter(req), {
        all: {filter: "test"},
        primary: ["filter"],
        secondary: {},
    });

    req.query.start = 100;

    t.same(paramFilter(req), {
        all: {filter: "test"},
        primary: ["filter"],
        secondary: {
            start: 100,
        },
    });

    // Test keepSecondary
    t.same(paramFilter(req, {}, true), {
        all: {filter: "test", start: 100},
        primary: ["filter"],
        secondary: {
            start: 100,
        },
    });
});

tap.test("paramFilter - options", {autoend: true}, (t) => {
    const req = {
        query: {
            filter: "test",
            start: 0,
        },
    };

    const options = {
        filter: "test2",
    };

    t.same(paramFilter(req, options), {
        all: {filter: "test2"},
        primary: ["filter"],
        secondary: {},
    });
});

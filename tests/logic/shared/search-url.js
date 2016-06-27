"use strict";

const tap = require("tap");

require("../../init");

const searchURLMethods = require("../../../logic/shared/search-url");
//const searchURL = searchURLMethods.searchURL;
const paramFilter = searchURLMethods.paramFilter;

tap.test("paramFilter", {autoend: true}, (t) => {
    const req = {
        query: {
            filter: "test",
        },
    };

    const results = paramFilter(req);

    t.equal(results, {filter: "text"});
});

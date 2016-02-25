"use strict";

const tap = require("tap");

const init = require("./lib/init");
const req = init.req;

tap.test("url", {autoend: true}, (t) => {
    const batch = init.getBatch();
    t.equal(batch.url(req),
        "http://localhost:3000/source/test/import?images=test/started",
        "Get URL");
});

tap.test("getSource", {autoend: true}, (t) => {
    const batch = init.getBatch();
    const source = init.getSource();
    t.equal(batch.getSource(), source, "Get Source");
});

tap.test("getCurState", {autoend: true}, (t) => {
    const batch = init.getBatch();
    const state = batch.getCurState();
    t.equal(state.id, "started", "Get State ID");
    t.equal(state.name(req), "Uploaded.", "Get State Name");
});

tap.test("getNextState", {autoend: true}, (t) => {
    const batch = init.getBatch();
    const state = batch.getNextState();
    t.equal(state.id, "process.started", "Get State ID");
    t.equal(state.name(req), "Processing...", "Get State Name");
});

tap.test("canAdvance", {autoend: true}, (t) => {
    const batch = init.getBatch();
    t.equal(batch.canAdvance(), true, "Check if state can advance");
});

tap.test("saveState", (t) => {
    const batch = init.getBatch();
    batch.saveState("process.started", () => {
        const state = batch.getCurState();
        t.equal(state.id, "process.started", "Get State ID");
        t.equal(state.name(req), "Processing...", "Get State Name");
        t.end();
    });
});

tap.test("processImages", (t) => {
    const batch = init.getBatch();
    batch.processImages((err) => {
        t.error(err, "Error should be empty.");

        const expected = init.getImageResultsData();

        t.equal(batch.results.length, expected.length);
        expected.forEach((item, i) => {
            t.same(batch.results[i], item);
        });

        t.end();
    });
});

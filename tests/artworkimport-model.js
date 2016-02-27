"use strict";

const fs = require("fs");
const path = require("path");

const tap = require("tap");

const init = require("./lib/init");
//const stub = init.stub;
const req = init.req;
const ArtworkImport = init.ArtworkImport;

tap.test("url", {autoend: true}, (t) => {
    const batch = init.getArtworkBatch();
    t.equal(batch.url(req),
        "http://localhost:3000/source/test/import?artworks=test/started",
        "Get URL");
});

tap.test("getSource", {autoend: true}, (t) => {
    const batch = init.getArtworkBatch();
    const source = init.getSource();
    t.equal(batch.getSource(), source, "Get Source");
});

tap.test("getCurState", {autoend: true}, (t) => {
    const batch = init.getArtworkBatch();
    const state = batch.getCurState();
    t.equal(state.id, "started", "Get State ID");
    t.equal(state.name(req), "Uploaded.", "Get State Name");
});

tap.test("getNextState", {autoend: true}, (t) => {
    const batch = init.getArtworkBatch();
    const state = batch.getNextState();
    t.equal(state.id, "process.started", "Get State ID");
    t.equal(state.name(req), "Processing...", "Get State Name");
});

tap.test("canAdvance", {autoend: true}, (t) => {
    const batch = init.getArtworkBatch();
    t.equal(batch.canAdvance(), true, "Check if state can advance");
});

tap.test("getError", {autoend: true}, (t) => {
    const errors = ["ABANDONED", "ERROR_READING_DATA"];
    for (const error of errors) {
        t.ok(ArtworkImport.getError(error, req), error);
        t.notEqual(ArtworkImport.getError(error, req), error, error);
    }
});

tap.test("saveState", (t) => {
    const batch = init.getArtworkBatch();
    batch.saveState("process.started", () => {
        const state = batch.getCurState();
        t.equal(state.id, "process.started", "Get State ID");
        t.equal(state.name(req), "Processing...", "Get State Name");
        t.end();
    });
});

tap.test("setResults", (t) => {
    const batch = init.getArtworkBatch();
    const dataFile = path.resolve(process.cwd(), "data", "default.json");
    batch.setResults([fs.createReadStream(dataFile)], (err) => {
        t.error(err, "Error should be empty.");
        t.equal(batch.results.length, 6, "Check number of results");
        for (const result of batch.results) {
            t.equal(result.result, "unknown");
            t.ok(result.data);
            t.equal(result.data.lang, "en");
        }
        t.end();
    });
});

tap.test("setResults (with error)", (t) => {
    const batch = init.getArtworkBatch();
    const dataFile = path.resolve(process.cwd(), "data", "default-error.json");
    batch.setResults([fs.createReadStream(dataFile)], (err) => {
        t.error(err, "Error should be empty.");
        t.equal(batch.error,
            "Invalid JSON (Unexpected \"i\" at position 16 in state STOP)");
        t.equal(ArtworkImport.getError(batch.error),
            "Invalid JSON (Unexpected \"i\" at position 16 in state STOP)");
        t.equal(batch.state, "error");
        t.equal(batch.results.length, 0, "Check number of results");
        t.end();
    });
});

tap.test("processArtworks", (t) => {
    const batch = init.getArtworkBatch();
    const dataFile = path.resolve(process.cwd(), "data", "default.json");
    batch.setResults([fs.createReadStream(dataFile)], (err) => {
        batch.processArtworks(() => {
            //console.log(JSON.stringify(batch.results, null, "    "));
            t.equal(batch.results.length, 8, "Check number of results");
            // TODO: Check the state of the results
            t.end();
        });
    });
});

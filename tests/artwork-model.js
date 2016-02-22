"use strict";

const tap = require("tap");
const sinon = require("sinon");

const core = require("../core");
const Artwork = core.models.Artwork;
const Source = core.models.Source;

const source = new Source({
    _id: "test",
    url: "http://test.com/",
    name: "Test Source",
    shortName: "test",
});

sinon.stub(Source, "getSources", () => [source]);

const artworkData = {
    _id: "test/1234",
    id: "1234",
    source: "test",
    lang: "en",
    url: "http://google.com",
    images: ["foo.jpg"],
    defaultImageHash: "4567",
    title: "Test",
    objectType: "painting",
    artists: [{name: "Test"}],
    dimensions: [{width: 123, unit: "mm"}],
    dates: [{start: 1456, end: 1457, circa: true}],
    locations: [{city: "New York City"}],
};
const artwork = new Artwork(artworkData);

sinon.stub(Artwork, "findById", (id, callback) => {
    if (id === artwork._id) {
        process.nextTick(() => callback(null, artwork));
    } else {
        process.nextTick(() => callback(new Error("Artwork not found.")));
    }
});

// TODO(jeresig): Stub out Image.findById

/*
const req = {
    format: (msg, fields) =>
        msg.replace(/%\((.*?)\)s/g, (all, name) => fields[name]),
    gettext: (msg) => msg,
};
*/

tap.test("getURL", {autoend: true}, (t) => {
    t.equal(artwork.getURL("en"),
        "http://localhost:3000/artworks/test/1234", "Check 'en' URL");

    t.equal(artwork.getURL("de"),
        "http://localhost:3000/artworks/test/1234?lang=de", "Check 'de' URL");
});

tap.test("getThumbURL", {autoend: true}, (t) => {
    t.equal(artwork.getThumbURL(),
        "http://localhost:3000/data/test/thumbs/4567.jpg", "Check Thumb URL");
});

tap.test("getTitle", {autoend: true}, (t) => {
    t.equal(artwork.getTitle("en"),
        "Test - Test Source", "Check Title");
});

tap.test("getSource", {autoend: true}, (t) => {
    t.equal(artwork.getSource(),
        source, "Get Source");
});

/*
tap.test("fromData", (t) => {
    Artwork.fromData(artworkData, req, (err, artwork) => {

    });
});
*/

"use strict";

const tap = require("tap");
const sinon = require("sinon");

const core = require("../core");
const Artwork = core.models.Artwork;
const Image = core.models.Image;
const Source = core.models.Source;

const source = new Source({
    _id: "test",
    url: "http://test.com/",
    name: "Test Source",
    shortName: "test",
});

sinon.stub(Source, "getSources", () => [source]);

const artworkData = {
    id: "1234",
    source: "test",
    lang: "en",
    url: "http://google.com",
    images: ["foo.jpg"],
    title: "Test",
    objectType: "painting",
    artists: [{name: "Test"}],
    dimensions: [{width: 123, unit: "mm"}],
    dates: [{start: 1456, end: 1457, circa: true}],
    locations: [{city: "New York City"}],
};

const artwork = new Artwork(Object.assign({}, artworkData, {
    _id: "test/1234",
    images: ["test/foo.jpg"],
    defaultImageHash: "4567",
}));

sinon.stub(Artwork, "findById", (id, callback) => {
    if (id === artwork._id) {
        process.nextTick(() => callback(null, artwork));
    } else {
        process.nextTick(() => callback(new Error("Artwork not found.")));
    }
});

const image = new Image({
    _id: "test/foo.jpg",
    source: "test",
    fileName: "foo.jpg",
    hash: "4567",
    width: 100,
    height: 100,
});

sinon.stub(Image, "findById", (id, callback) => {
    if (id === image._id) {
        process.nextTick(() => callback(null, image));
    } else {
        process.nextTick(() => callback(new Error("Image not found.")));
    }
});

const req = {
    format: (msg, fields) =>
        msg.replace(/%\((.*?)\)s/g, (all, name) => fields[name]),
    gettext: (msg) => msg,
};

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
    t.equal(artwork.getTitle(req), "Test - Test Source", "Check Title");

    artwork.title = null;
    t.equal(artwork.getTitle(req), "Painting - Test Source", "Check Title");

    artwork.objectType = null;
    t.equal(artwork.getTitle(req), "Artwork - Test Source", "Check Title");

    artwork.title = "Test";
    artwork.objectType = "painting";
});

tap.test("getSource", {autoend: true}, (t) => {
    t.equal(artwork.getSource(), source, "Get Source");
});

tap.test("date", {autoend: true}, (t) => {
    t.same(artwork.date.toJSON(),
        {start: 1456, end: 1457, circa: true, years: []},
        "Get Date");
});

tap.test("fromData", (t) => {
    t.test("Data error", (t) => {
        Artwork.fromData({}, req, (err, value, warnings) => {
            t.equal(err.message, "Required field `id` is empty.",
                "Data error.");
            t.equal(value, undefined, "No artwork should be returned.");
            t.equal(warnings, undefined, "There should be no warnings.");
            t.end();
        });
    });
    t.test("Existing artwork", (t) => {
        Artwork.fromData(artworkData, req, (err, value, warnings) => {
            t.error(err, "Error should be empty");
            t.equal(value, artwork, "Artwork should be returned.");
            t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
            t.equal(value.images.length, 1, "Images are set.");
            t.equal(value.images[0], "test/foo.jpg", "Images are set.");
            t.same(warnings, [], "There should be no warnings.");
            t.end();
        });
    });

    t.test("New artwork", (t) => {
        const newData = Object.assign({}, artworkData, {
            id: "4567",
        });

        Artwork.fromData(newData, req, (err, value, warnings) => {
            t.error(err, "Error should be empty");
            t.equal(value._id, "test/4567", "New artwork should be returned.");
            t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
            t.equal(value.images.length, 1, "Images are set.");
            t.equal(value.images[0], "test/foo.jpg", "Images are set.");
            t.same(warnings, [], "There should be no warnings.");
            t.end();
        });
    });

    t.test("New artwork with warnings", (t) => {
        const newData = Object.assign({}, artworkData, {
            id: "4567",
            batch: "batch",
        });

        Artwork.fromData(newData, req, (err, value, warnings) => {
            t.error(err, "Error should be empty");
            t.equal(value._id, "test/4567", "New artwork should be returned.");
            t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
            t.equal(value.images.length, 1, "Images are set.");
            t.equal(value.images[0], "test/foo.jpg", "Images are set.");
            t.same(warnings, ["Unrecognized field `batch`."],
                "There should be a single warning.");
            t.end();
        });
    });

    t.test("New artwork missing images", (t) => {
        const newData = Object.assign({}, artworkData, {
            id: "4567",
            images: ["missing.jpg"],
        });

        Artwork.fromData(newData, req, (err, value, warnings) => {
            t.equal(err.message, "No images found.", "No images found.");
            t.equal(value, undefined, "No artwork should be returned.");
            t.equal(warnings, undefined, "There should be no warnings.");
            t.end();
        });
    });

    t.test("New artwork missing single image", (t) => {
        const newData = Object.assign({}, artworkData, {
            id: "4567",
            images: ["missing.jpg", "foo.jpg"],
        });

        Artwork.fromData(newData, req, (err, value, warnings) => {
            t.error(err, "Error should be empty");
            t.equal(value._id, "test/4567", "New artwork should be returned.");
            t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
            t.equal(value.images.length, 1, "Images are set.");
            t.equal(value.images[0], "test/foo.jpg", "Images are set.");
            t.same(warnings, ["Image file not found: missing.jpg"],
                "There should be a warning.");
            t.end();
        });
    });

    t.end();
});

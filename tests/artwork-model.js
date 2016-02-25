"use strict";

const tap = require("tap");

const init = require("./lib/init");
const req = init.req;
const Artwork = init.Artwork;

tap.test("getURL", {autoend: true}, (t) => {
    const artwork = init.getArtwork();
    t.equal(artwork.getURL("en"),
        "http://localhost:3000/artworks/test/1234", "Check 'en' URL");

    t.equal(artwork.getURL("de"),
        "http://localhost:3000/artworks/test/1234?lang=de", "Check 'de' URL");
});

tap.test("getThumbURL", {autoend: true}, (t) => {
    const artwork = init.getArtwork();
    t.equal(artwork.getThumbURL(),
        "http://localhost:3000/data/test/thumbs/4567.jpg", "Check Thumb URL");
});

tap.test("getTitle", {autoend: true}, (t) => {
    const artwork = init.getArtwork();
    t.equal(artwork.getTitle(req), "Test - Test Source", "Check Title");

    artwork.title = null;
    t.equal(artwork.getTitle(req), "Painting - Test Source", "Check Title");

    artwork.objectType = null;
    t.equal(artwork.getTitle(req), "Artwork - Test Source", "Check Title");

    artwork.title = "Test";
    artwork.objectType = "painting";
});

tap.test("getSource", {autoend: true}, (t) => {
    const artwork = init.getArtwork();
    const source = init.getSource();
    t.equal(artwork.getSource(), source, "Get Source");
});

tap.test("date", {autoend: true}, (t) => {
    const artwork = init.getArtwork();
    t.same(artwork.date.toJSON(),
        {start: 1456, end: 1457, circa: true, years: []},
        "Get Date");
});

tap.test("Artwork.fromData: Data error", (t) => {
    Artwork.fromData({}, req, (err, value, warnings) => {
        t.equal(err.message, "Required field `id` is empty.",
            "Data error.");
        t.equal(value, undefined, "No artwork should be returned.");
        t.equal(warnings, undefined, "There should be no warnings.");
        t.end();
    });
});

tap.test("Artwork.fromData: Existing artwork", (t) => {
    const artwork = init.getArtwork();
    const artworkData = init.getArtworkData();
    Artwork.fromData(artworkData, req, (err, value, warnings) => {
        t.error(err, "Error should be empty.");
        t.equal(value, artwork, "Artwork should be returned.");
        t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
        t.equal(value.images.length, 1, "Images are set.");
        t.equal(value.images[0], "test/foo.jpg", "Images are set.");
        t.same(warnings, [], "There should be no warnings.");
        t.end();
    });
});

tap.test("Artwork.fromData: New artwork", (t) => {
    const artworkData = init.getArtworkData();
    const newData = Object.assign({}, artworkData, {
        id: "4567",
    });

    Artwork.fromData(newData, req, (err, value, warnings) => {
        t.error(err, "Error should be empty.");
        t.equal(value._id, "test/4567", "New artwork should be returned.");
        t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
        t.equal(value.images.length, 1, "Images are set.");
        t.equal(value.images[0], "test/foo.jpg", "Images are set.");
        t.same(warnings, [], "There should be no warnings.");
        t.end();
    });
});

tap.test("Artwork.fromData: New artwork with warnings", (t) => {
    const artworkData = init.getArtworkData();
    const newData = Object.assign({}, artworkData, {
        id: "4567",
        batch: "batch",
    });

    Artwork.fromData(newData, req, (err, value, warnings) => {
        t.error(err, "Error should be empty.");
        t.equal(value._id, "test/4567", "New artwork should be returned.");
        t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
        t.equal(value.images.length, 1, "Images are set.");
        t.equal(value.images[0], "test/foo.jpg", "Images are set.");
        t.same(warnings, ["Unrecognized field `batch`."],
            "There should be a single warning.");
        t.end();
    });
});

tap.test("Artwork.fromData: New artwork missing images", (t) => {
    const artworkData = init.getArtworkData();
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

tap.test("Artwork.fromData: New artwork missing single image", (t) => {
    const artworkData = init.getArtworkData();
    const newData = Object.assign({}, artworkData, {
        id: "4567",
        images: ["missing.jpg", "foo.jpg"],
    });

    Artwork.fromData(newData, req, (err, value, warnings) => {
        t.error(err, "Error should be empty.");
        t.equal(value._id, "test/4567", "New artwork should be returned.");
        t.equal(value.defaultImageHash, "4567", "defaultImageHash is set.");
        t.equal(value.images.length, 1, "Images are set.");
        t.equal(value.images[0], "test/foo.jpg", "Images are set.");
        t.same(warnings, ["Image file not found: missing.jpg"],
            "There should be a warning.");
        t.end();
    });
});

tap.test("updateSimilarity", (t) => {
    const artwork = init.getArtwork();
    artwork.updateSimilarity((err) => {
        t.error(err, "Error should be empty.");
        t.equal(artwork.similarArtworks.length, 1,
            "Correct number of matches.");
        t.same(artwork.similarArtworks[0].toJSON(), {
            _id: "test/1235",
            artwork: "test/1235",
            score: 10,
            source: "test",
            images: ["test/bar.jpg"],
        }, "Check similar artwork result");
        t.end();
    });
});

tap.test("updateSimilarity with two matches", (t) => {
    const artworks = init.getArtworks();
    const artwork = artworks["test/1235"];
    artwork.updateSimilarity((err) => {
        t.error(err, "Error should be empty.");
        t.equal(artwork.similarArtworks.length, 2,
            "Correct number of matches.");
        t.same(artwork.similarArtworks[0].toJSON(), {
            _id: "test/1236",
            artwork: "test/1236",
            score: 17,
            source: "test",
            images: ["test/zoo.jpg", "test/zoo2.jpg"],
        }, "Check similar artwork result");
        t.same(artwork.similarArtworks[1].toJSON(), {
            _id: "test/1234",
            artwork: "test/1234",
            score: 10,
            source: "test",
            images: ["test/foo.jpg"],
        }, "Check similar artwork result");
        t.end();
    });
});

tap.test("updateSimilarity with no similar", (t) => {
    const artworks = init.getArtworks();
    const artwork = artworks["test/1237"];
    artwork.updateSimilarity((err) => {
        t.error(err, "Error should be empty.");
        t.equal(artwork.similarArtworks.length, 0,
            "Correct number of matches.");
        t.end();
    });
});

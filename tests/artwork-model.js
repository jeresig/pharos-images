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

const artworks = {
    "test/1234": new Artwork(Object.assign({}, artworkData, {
        _id: "test/1234",
        images: ["test/foo.jpg"],
        defaultImageHash: "4567",
    })),

    "test/1235": new Artwork(Object.assign({}, artworkData, {
        _id: "test/1235",
        images: ["test/bar.jpg"],
        defaultImageHash: "4568",
    })),

    "test/1236": new Artwork(Object.assign({}, artworkData, {
        _id: "test/1236",
        images: ["test/zoo.jpg", "test/zoo2.jpg", "test/zoo3.jpg"],
        defaultImageHash: "4569",
    })),

    "test/1237": new Artwork(Object.assign({}, artworkData, {
        _id: "test/1237",
        images: ["test/nosimilar.jpg"],
        defaultImageHash: "4570",
    })),
};

const artwork = artworks["test/1234"];

sinon.stub(Artwork, "findById", (id, callback) => {
    if (artworks[id]) {
        process.nextTick(() => callback(null, artworks[id]));
    } else {
        process.nextTick(() => callback(new Error("Artwork not found.")));
    }
});

sinon.stub(Artwork, "find", (query, callback) => {
    const matches = [];
    const imageIds = query["$or"].map((query) => query.images);

    for (const id in artworks) {
        const artwork = artworks[id];

        if (query._id["$ne"] === id) {
            continue;
        }

        for (const imageId of imageIds) {
            if (artwork.images.indexOf(imageId) >= 0) {
                matches.push(artwork);
                break;
            }
        }
    }

    process.nextTick(() => callback(null, matches));
});

const images = {
    "test/foo.jpg": new Image({
        _id: "test/foo.jpg",
        source: "test",
        fileName: "foo.jpg",
        hash: "4567",
        width: 100,
        height: 100,
        similarImages: [{_id: "test/bar.jpg", score: 10}],
    }),

    "test/bar.jpg": new Image({
        _id: "test/bar.jpg",
        source: "test",
        fileName: "bar.jpg",
        hash: "4568",
        width: 120,
        height: 120,
        similarImages: [
            {_id: "test/foo.jpg", score: 10},
            {_id: "test/zoo2.jpg", score: 9},
            {_id: "test/zoo.jpg", score: 8},
        ],
    }),

    "test/zoo.jpg": new Image({
        _id: "test/zoo.jpg",
        source: "test",
        fileName: "zoo.jpg",
        hash: "4569",
        width: 115,
        height: 115,
        similarImages: [{_id: "test/bar.jpg", score: 8}],
    }),

    "test/zoo2.jpg": new Image({
        _id: "test/zoo2.jpg",
        source: "test",
        fileName: "zoo2.jpg",
        hash: "4571",
        width: 116,
        height: 116,
        similarImages: [{_id: "test/bar.jpg", score: 9}],
    }),

    "test/zoo3.jpg": new Image({
        _id: "test/zoo3.jpg",
        source: "test",
        fileName: "zoo3.jpg",
        hash: "4572",
        width: 117,
        height: 117,
        similarImages: [],
    }),

    "test/nosimilar.jpg": new Image({
        _id: "test/nosimilar.jpg",
        source: "test",
        fileName: "nosimilar.jpg",
        hash: "4570",
        width: 110,
        height: 110,
        similarImages: [],
    }),
};

sinon.stub(Image, "findById", (id, callback) => {
    if (images[id]) {
        process.nextTick(() => callback(null, images[id]));
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
            t.error(err, "Error should be empty.");
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
            t.error(err, "Error should be empty.");
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

    t.end();
});

tap.test("updateSimilarity", (t) => {
    t.test("updateSimilarity", (t) => {
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

    t.test("updateSimilarity with two matches", (t) => {
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

    t.test("updateSimilarity with no similar", (t) => {
        const artwork = artworks["test/1237"];
        artwork.updateSimilarity((err) => {
            t.error(err, "Error should be empty.");
            t.equal(artwork.similarArtworks.length, 0,
                "Correct number of matches.");
            t.end();
        });
    });

    t.end();
});

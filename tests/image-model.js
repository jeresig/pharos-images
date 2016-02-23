"use strict";

process.env.PASTEC_URL = "http://localhost:8000/";
process.env.THUMB_SIZE = "220x220";
process.env.SCALED_SIZE = "300x300";
process.env.BASE_DATA_DIR = "/tmp/";

const fs = require("fs");
const path = require("path");

const tap = require("tap");
const sinon = require("sinon");
const mockfs = require("mock-fs");

const core = require("../core");
const Image = core.models.Image;
const Source = core.models.Source;
const ImageImport = core.models.ImageImport;

const testFiles = {};

console.log("Reading in test files...");
const dataDir = path.resolve(__dirname, "data");
fs.readdirSync(dataDir).forEach((file) => {
    console.log(path.resolve(dataDir, file));
    testFiles[file] = fs.readFileSync(path.resolve(dataDir, file));
});

const source = new Source({
    _id: "test",
    url: "http://test.com/",
    name: "Test Source",
    shortName: "test",
});

sinon.stub(Source, "getSources", () => [source]);
sinon.stub(Source.prototype, "getDirBase", function() {
    return path.resolve(process.cwd(), `sources/${this._id}`);
});

sinon.stub(Image, "findById", (id, callback) => {
    process.nextTick(() => callback(null, images[id]));
});

sinon.stub(Image, "findOne", (query, callback) => {
    let match;

    if (query.hash) {
        const id = Object.keys(images)
            .find((id) => images[id].hash === query.hash);
        match = images[id];
    }

    process.nextTick(() => callback(null, match));
});

//sinon.stub(Image.schema.methods, "save", (callback) => {
//    process.nextTick(callback);
//});

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

const image = images["test/foo.jpg"];

const similar = {
    "4567": [
        {id: "4567", score: 100},
        {id: "4568", score: 10},
        {id: "NO_LONGER_EXISTS", score: 1},
    ],
    "4568": [
        {id: "4568", score: 100},
        {id: "4567", score: 10},
        {id: "4571", score: 9},
        {id: "4569", score: 8},
    ],
    "4569": [
        {id: "4569", score: 100},
        {id: "4568", score: 8},
    ],
    "4571": [
        {id: "4571", score: 100},
        {id: "4568", score: 9},
    ],
    "4572": [
        {id: "4572", score: 100},
    ],
    "4570": [
        {id: "4570", score: 100},
    ],
};

const similarAdded = [];

sinon.stub(core.similar, "similar", (hash, callback) => {
    process.nextTick(() => callback(null, similar[hash]));
});

sinon.stub(core.similar, "idIndexed", (hash, callback) => {
    process.nextTick(() => callback(null, !!similar[hash]));
});

sinon.stub(core.similar, "add", (file, hash, callback) => {
    if (hash === "99998") {
        return process.nextTick(() => callback({type: "IMAGE_SIZE_TOO_SMALL"}));
    }

    similarAdded.push({id: hash, score: 5});
    similar[hash] = similarAdded;

    process.nextTick(callback);
});

tap.beforeEach((done) => {
    mockfs({
        "sources/test": {
            "images": {},
            "scaled": {},
            "thumbs": {},
        },
        "data": testFiles,
    });
    done();
});

tap.afterEach((done) => {
    mockfs.restore();
    done();
});

tap.test("getFilePath", {autoend: true}, (t) => {
    t.equal(image.getFilePath(),
        path.resolve(process.cwd(), "sources/test/images/4567.jpg"),
        "Check file path");
});

tap.test("getOriginalURL", {autoend: true}, (t) => {
    t.equal(image.getOriginalURL(),
        "http://localhost:3000/data/test/images/4567.jpg", "Check Image URL");
});

tap.test("getScaledURL", {autoend: true}, (t) => {
    t.equal(image.getScaledURL(),
        "http://localhost:3000/data/test/scaled/4567.jpg", "Check Scaled URL");
});

tap.test("getThumbURL", {autoend: true}, (t) => {
    t.equal(image.getThumbURL(),
        "http://localhost:3000/data/test/thumbs/4567.jpg", "Check Thumb URL");
});

tap.test("getSource", {autoend: true}, (t) => {
    t.equal(image.getSource(), source, "Get Source");
});

tap.test("updateSimilarity", (t) => {
    t.test("Existing Image", (t) => {
        const oldSimilar = image.similarImages;
        image.updateSimilarity((err) => {
            t.error(err, "No error should be thrown.");
            t.notEqual(image.similarImages, oldSimilar, "Similarity updated.");
            t.equal(image.similarImages.length, 1,
                "Has the correct number of results.");
            t.same(image.similarImages[0].toJSON(),
                {_id: "test/bar.jpg", score: 10},
                "Has the correct result.");
            t.end();
        });
    });

    t.test("Missing Image", (t) => {
        const image = new Image({
            _id: "test/foo",
            source: "test",
            fileName: "sadfasdfds.jpg",
            hash: "99999",
            width: 115,
            height: 115,
        });

        const oldSimilar = image.similarImages;
        image.updateSimilarity((err) => {
            t.error(err, "No error should be thrown.");
            t.equal(image.similarImages, oldSimilar, "Similarity not updated.");
            t.end();
        });
    });

    t.end();
});

tap.test("indexSimilarity", (t) => {
    t.test("Existing Image", (t) => {
        image.indexSimilarity((err, indexed) => {
            t.error(err, "No error should be thrown.");
            t.equal(indexed, true, "Image is indexed.");
            t.end();
        });
    });

    t.test("Missing Image", (t) => {
        const image = new Image({
            _id: "test/foo",
            source: "test",
            fileName: "sadfasdfds.jpg",
            hash: "99999",
            width: 115,
            height: 115,
        });

        image.indexSimilarity((err, indexed) => {
            t.error(err, "No error should be thrown.");
            t.equal(indexed, true, "Image is indexed.");
            t.end();
        });
    });

    t.test("Small Image", (t) => {
        const image = new Image({
            _id: "test/foo2",
            source: "test",
            fileName: "sadfasdfds2.jpg",
            hash: "99998",
            width: 90,
            height: 90,
        });

        image.indexSimilarity((err, indexed) => {
            t.error(err, "No error should be thrown.");
            t.equal(indexed, undefined, "Image is not indexed.");
            t.end();
        });
    });

    t.end();
});

tap.test("fromFile", (t) => {
    t.test("New Image", (t) => {
        const batch = new ImageImport({
            _id: "testBatch",
            source: "test",
        });

        const testFile = path.resolve(process.cwd(), "data", "new1.jpg");

        Image.fromFile(batch, testFile, (err, image, warnings) => {
            t.error(err, "No error should be thrown.");
            t.ok(image, "Image exists.");
            t.equal(warnings.length, 0, "No warnings.");
            // TODO: Test that files exist.
            // Test that files are the right dimensions.
            t.end();
        });
    });

    t.test("New Image (Empty File)", (t) => {
        const batch = new ImageImport({
            _id: "testBatch",
            source: "test",
        });

        const testFile = path.resolve(process.cwd(), "data", "empty.jpg");

        Image.fromFile(batch, testFile, (err, image, warnings) => {
            t.ok(err, "Has error object.");
            t.equal(err.message, "The image is empty.", "Has error message.");
            t.notOk(image, "No image object");
            t.notOk(warnings, "No warnings object.");
            t.end();
        });
    });

    t.test("New Image (Corrupted File)", (t) => {
        const batch = new ImageImport({
            _id: "testBatch",
            source: "test",
        });

        const testFile = path.resolve(process.cwd(), "data", "corrupted.jpg");

        Image.fromFile(batch, testFile, (err, image, warnings) => {
            t.ok(err, "Has error object.");
            t.equal(err.message, "There was an error processing the image. " +
                "Perhaps it is malformed in some way.", "Has error message.");
            t.notOk(image, "No image object");
            t.notOk(warnings, "No warnings object.");
            t.end();
        });
    });

    t.test("New Image (Small File)", (t) => {
        const batch = new ImageImport({
            _id: "testBatch",
            source: "test",
        });

        const testFile = path.resolve(process.cwd(), "data", "small.jpg");

        Image.fromFile(batch, testFile, (err, image, warnings) => {
            t.error(err, "No error should be thrown.");
            t.ok(image, "Image exists.");
            t.same(warnings, ["The image is too small to work with the image " +
                "similarity algorithm. It must be at least 150px on each " +
                "side."], "One warning.");
            t.end();
        });
    });

    t.test("Updating Image", (t) => {
        const batch = new ImageImport({
            _id: "testBatch",
            source: "test",
        });

        const testFile = path.resolve(process.cwd(), "data", "foo.jpg");

        Image.fromFile(batch, testFile, (err, image, warnings) => {
            t.error(err, "No error should be thrown.");
            t.ok(image, "Image exists.");
            t.same(warnings, ["A new version of the image was uploaded, " +
                "replacing the old one."], "One warning.");
            t.end();
        });
    });

    t.test("Updating Image (files already exist)", (t) => {
        const batch = new ImageImport({
            _id: "testBatch",
            source: "test",
        });

        const testFile = path.resolve(process.cwd(), "data", "foo.jpg");

        Image.fromFile(batch, testFile, (err, image, warnings) => {
            // Run this twice to have the images be put into place already
            Image.fromFile(batch, testFile, (err, image, warnings) => {
                t.error(err, "No error should be thrown.");
                t.ok(image, "Image exists.");
                t.equal(warnings.length, 0, "No warnings.");
                t.end();
            });
        });
    });

    t.end();
});

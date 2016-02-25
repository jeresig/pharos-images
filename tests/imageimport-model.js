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
const dataDir = path.resolve(__dirname, "data");

fs.readdirSync(dataDir).forEach((file) => {
    if (file.endsWith(".jpg") || file.endsWith(".zip")) {
        testFiles[file] = fs.readFileSync(path.resolve(dataDir, file));
    }
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

const batches = [
    new ImageImport({
        _id: "test/started",
        source: "test",
        zipFile: path.resolve(process.cwd(), "data", "test.zip"),
        fileName: "test.zip",
    }),

    new ImageImport({
        source: "test",
        state: "process.started",
        zipFile: path.resolve(process.cwd(), "data", "test.zip"),
        fileName: "test.zip",
    }),

    new ImageImport({
        source: "test",
        state: "process.completed",
        zipFile: path.resolve(process.cwd(), "data", "test.zip"),
        fileName: "test.zip",
    }),

    new ImageImport({
        source: "test",
        state: "completed",
        zipFile: path.resolve(process.cwd(), "data", "test.zip"),
        fileName: "test.zip",
    }),
];

for (const batch of batches) {
    sinon.stub(batch, "save", process.nextTick);
}

const batch = batches[0];

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

sinon.stub(Image, "update", (query, update, callback) => {
    process.nextTick(callback);
});

const fromFile = Image.fromFile;

sinon.stub(Image, "fromFile", (batch, file, callback) => {
    fromFile.call(Image, batch, file, (err, image, warnings) => {
        if (image) {
            sinon.stub(image, "save", process.nextTick);
        }

        callback(err, image, warnings);
    });
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

const req = {
    format: (msg, fields) =>
        msg.replace(/%\((.*?)\)s/g, (all, name) => fields[name]),
    gettext: (msg) => msg,
    lang: "en",
};

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

tap.test("url", {autoend: true}, (t) => {
    t.equal(batch.url(req),
        "http://localhost:3000/source/test/import?images=test/started",
        "Get URL");
});

tap.test("getSource", {autoend: true}, (t) => {
    t.equal(batch.getSource(), source, "Get Source");
});

tap.test("getCurState", {autoend: true}, (t) => {
    const state = batch.getCurState();
    t.equal(state.id, "started", "Get State ID");
    t.equal(state.name(req), "Uploaded.", "Get State Name");
});

tap.test("getNextState", {autoend: true}, (t) => {
    const state = batch.getNextState();
    t.equal(state.id, "process.started", "Get State ID");
    t.equal(state.name(req), "Processing...", "Get State Name");
});

tap.test("canAdvance", {autoend: true}, (t) => {
    t.equal(batch.canAdvance(), true, "Check if state can advance");
});

tap.test("saveState", (t) => {
    batch.saveState("process.started", () => {
        const state = batch.getCurState();
        t.equal(state.id, "process.started", "Get State ID");
        t.equal(state.name(req), "Processing...", "Get State Name");
        t.end();
    });
});

tap.test("processImages", (t) => {
    batch.processImages((err) => {
        t.error(err, "Error should be empty.");

        const expected = [
            {
                "_id": "bar.jpg",
                "state": "started",
                "fileName": "bar.jpg",
                "warnings": [
                    "A new version of the image was uploaded, replacing the " +
                        "old one.",
                ],
                "model": "test/bar.jpg",
            },
            {
                "_id": "corrupted.jpg",
                "state": "started",
                "fileName": "corrupted.jpg",
                "error": "There was an error processing the image. Perhaps " +
                    "it is malformed in some way.",
            },
            {
                "_id": "empty.jpg",
                "state": "started",
                "fileName": "empty.jpg",
                "error": "The image is empty.",
            },
            {
                "_id": "foo.jpg",
                "state": "started",
                "fileName": "foo.jpg",
                "warnings": [
                    "A new version of the image was uploaded, replacing the " +
                        "old one.",
                ],
                "model": "test/foo.jpg",
            },
            {
                "_id": "new1.jpg",
                "state": "started",
                "fileName": "new1.jpg",
                "warnings": [],
                "model": "test/new1.jpg",
            },
            {
                "_id": "new2.jpg",
                "state": "started",
                "fileName": "new2.jpg",
                "warnings": [],
                "model": "test/new2.jpg",
            },
            {
                "_id": "small.jpg",
                "state": "started",
                "fileName": "small.jpg",
                "warnings": [
                    "The image is too small to work with the image " +
                        "similarity algorithm. It must be at least 150px " +
                        "on each side.",
                ],
                "model": "test/small.jpg",
            },
            {
                "_id": "new3.jpg",
                "state": "started",
                "fileName": "new3.jpg",
                "warnings": [],
                "model": "test/new3.jpg",
            },
        ];

        t.equal(batch.results.length, expected.length);
        expected.forEach((item, i) => {
            t.same(batch.results[i], item);
        });

        t.end();
    });
});

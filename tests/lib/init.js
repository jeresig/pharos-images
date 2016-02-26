"use strict";

// Some dummy ENV variables used for testing
process.env.PASTEC_URL = "http://localhost:8000/";
process.env.THUMB_SIZE = "220x220";
process.env.SCALED_SIZE = "300x300";
process.env.BASE_DATA_DIR = "/tmp/";

const fs = require("fs");
const path = require("path");

const tap = require("tap");
const sinon = require("sinon");
const mockfs = require("mock-fs");

const core = require("../../core");

// Models used for testing
const Image = core.models.Image;
const Artwork = core.models.Artwork;
const Source = core.models.Source;
const ImageImport = core.models.ImageImport;

// Data used for testing
let source;
let batch;
let batches;
let imageResultsData;
let images;
let image;
let artworks;
let artwork;
let artworkData;
let similar;
let similarAdded;

// Sandbox the bound methods
let sandbox;

// Files used for testing
const testFiles = {};
const dataDir = path.resolve(__dirname, "..", "data");

fs.readdirSync(dataDir).forEach((file) => {
    if (file.endsWith(".jpg") || file.endsWith(".zip")) {
        testFiles[file] = fs.readFileSync(path.resolve(dataDir, file));
    }
});

const genData = () => {
    artworkData = {
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

    artworks = {
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

    artwork = artworks["test/1234"];

    source = new Source({
        _id: "test",
        url: "http://test.com/",
        name: "Test Source",
        shortName: "test",
    });

    const testZip = path.resolve(process.cwd(), "data", "test.zip");

    imageResultsData = [
        {
            "_id": "bar.jpg",
            "fileName": "bar.jpg",
            "warnings": [
                "A new version of the image was uploaded, replacing the " +
                    "old one.",
            ],
            "model": "test/bar.jpg",
        },
        {
            "_id": "corrupted.jpg",
            "fileName": "corrupted.jpg",
            "error": "There was an error processing the image. Perhaps " +
                "it is malformed in some way.",
        },
        {
            "_id": "empty.jpg",
            "fileName": "empty.jpg",
            "error": "The image is empty.",
        },
        {
            "_id": "foo.jpg",
            "fileName": "foo.jpg",
            "warnings": [
                "A new version of the image was uploaded, replacing the " +
                    "old one.",
            ],
            "model": "test/foo.jpg",
        },
        {
            "_id": "new1.jpg",
            "fileName": "new1.jpg",
            "warnings": [],
            "model": "test/new1.jpg",
        },
        {
            "_id": "new2.jpg",
            "fileName": "new2.jpg",
            "warnings": [],
            "model": "test/new2.jpg",
        },
        {
            "_id": "small.jpg",
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
            "fileName": "new3.jpg",
            "warnings": [],
            "model": "test/new3.jpg",
        },
    ];

    batches = [
        new ImageImport({
            _id: "test/started",
            source: "test",
            zipFile: testZip,
            fileName: "test.zip",
        }),

        new ImageImport({
            _id: "test/process-started",
            source: "test",
            state: "process.started",
            zipFile: testZip,
            fileName: "test.zip",
        }),

        new ImageImport({
            _id: "test/process-completed",
            source: "test",
            state: "process.completed",
            zipFile: testZip,
            fileName: "test.zip",
            results: imageResultsData,
        }),

        new ImageImport({
            _id: "test/process-completed2",
            source: "test",
            state: "process.completed",
            zipFile: testZip,
            fileName: "test.zip",
            results: imageResultsData,
        }),

        new ImageImport({
            _id: "test/completed",
            source: "test",
            state: "completed",
            zipFile: testZip,
            fileName: "test.zip",
            results: imageResultsData,
        }),

        new ImageImport({
            _id: "test/error",
            source: "test",
            state: "error",
            zipFile: testZip,
            fileName: "test.zip",
            error: "Error opening zip file.",
        }),
    ];

    for (const batch of batches) {
        sinon.stub(batch, "save", process.nextTick);
    }

    batch = batches[0];

    images = {
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

    image = images["test/foo.jpg"];

    similar = {
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

    similarAdded = [];
};

const bindStubs = () => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(Artwork, "findById", (id, callback) => {
        if (artworks[id]) {
            process.nextTick(() => callback(null, artworks[id]));
        } else {
            process.nextTick(() => callback(new Error("Artwork not found.")));
        }
    });

    sandbox.stub(Artwork, "find", (query, callback) => {
        const matches = [];
        const imageIds = query.$or.map((query) => query.images);

        for (const id in artworks) {
            const artwork = artworks[id];

            if (query._id.$ne === id) {
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

    sandbox.stub(ImageImport, "find", (query, select, callback) => {
        process.nextTick(() => {
            callback(null, batches.filter((batch) =>
                (batch.state !== "error" && batch.state !== "completed")));
        });
    });

    sandbox.stub(ImageImport, "findById", (id, callback) => {
        process.nextTick(() => {
            callback(null, batches.find((batch) => batch._id === id));
        });
    });

    sandbox.stub(Source, "getSources", () => [source]);
    sandbox.stub(Source.prototype, "getDirBase", function() {
        return path.resolve(process.cwd(), `sources/${this._id}`);
    });

    sandbox.stub(Image, "findById", (id, callback) => {
        process.nextTick(() => callback(null, images[id]));
    });

    sandbox.stub(Image, "findOne", (query, callback) => {
        // NOTE(jeresig): query.hash is assumed
        const id = Object.keys(images)
            .find((id) => images[id].hash === query.hash);
        const match = images[id];

        process.nextTick(() => callback(null, match));
    });

    sandbox.stub(Image, "update", (query, update, callback) => {
        process.nextTick(callback);
    });

    const fromFile = Image.fromFile;

    sandbox.stub(Image, "fromFile", (batch, file, callback) => {
        fromFile.call(Image, batch, file, (err, image, warnings) => {
            if (image && !image.save.restore) {
                sandbox.stub(image, "save", process.nextTick);
            }

            callback(err, image, warnings);
        });
    });

    sandbox.stub(core.similar, "similar", (hash, callback) => {
        process.nextTick(() => callback(null, similar[hash]));
    });

    sandbox.stub(core.similar, "idIndexed", (hash, callback) => {
        process.nextTick(() => callback(null, !!similar[hash]));
    });

    sandbox.stub(core.similar, "add", (file, hash, callback) => {
        if (hash === "99998") {
            return process.nextTick(() => callback({
                type: "IMAGE_SIZE_TOO_SMALL",
            }));
        }

        similarAdded.push({id: hash, score: 5});
        similar[hash] = similarAdded;

        process.nextTick(callback);
    });
};

const req = {
    format: (msg, fields) =>
        msg.replace(/%\((.*?)\)s/g, (all, name) => fields[name]),
    gettext: (msg) => msg,
    lang: "en",
};

tap.beforeEach((done) => {
    genData();
    bindStubs();

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
    sandbox.restore();
    mockfs.restore();
    done();
});

module.exports = {
    getBatch: () => batch,
    getBatches: () => batches,
    getImage: () => image,
    getSource: () => source,
    getArtwork: () => artwork,
    getArtworks: () => artworks,
    getArtworkData: () => artworkData,
    getImageResultsData: () => imageResultsData,
    req,
    Image,
    Artwork,
    ImageImport,
    Source,
    stub: sinon.stub,
};

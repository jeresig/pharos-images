"use strict";

const tap = require("tap");

const core = require("../core");
const Artwork = core.models.Artwork;

const req = {
    format: (msg, fields) =>
        msg.replace(/%\((.*?)\)s/g, (all, name) => fields[name]),
    gettext: (msg) => msg,
};

tap.test("Unknown Fields", {autoend: true}, (t) => {
    t.same(Artwork.lintData({
        batch: "test",
    }, req), {
        "error": "Required field `id` is empty.",
        "warnings": [
            "Unrecognized field `batch`.",
        ],
    }, "Known field");

    t.same(Artwork.lintData({
        random: "test",
    }, req), {
        "error": "Required field `id` is empty.",
        "warnings": [
            "Unrecognized field `random`.",
        ],
    }, "Unknown field");
});

tap.test("Required Fields", {autoend: true}, (t) => {
    t.same(Artwork.lintData({}, req), {
        "error": "Required field `id` is empty.",
        "warnings": [],
    }, "ID");

    t.same(Artwork.lintData({
        id: "",
    }, req), {
        "error": "Required field `id` is empty.",
        "warnings": [],
    }, "ID Empty String");

    t.same(Artwork.lintData({
        id: "1234",
    }, req), {
        "error": "Required field `source` is empty.",
        "warnings": [],
    }, "Source");

    t.same(Artwork.lintData({
        id: "1234",
        source: "",
    }, req), {
        "error": "Required field `source` is empty.",
        "warnings": [],
    }, "Source Empty String");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
    }, req), {
        "error": "Required field `lang` is empty.",
        "warnings": [],
    }, "Lang");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "",
    }, req), {
        "error": "Required field `lang` is empty.",
        "warnings": [],
    }, "Lang Empty String");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
    }, req), {
        "error": "Required field `url` is empty.",
        "warnings": [],
    }, "URL");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "",
    }, req), {
        "error": "Required field `url` is empty.",
        "warnings": [],
    }, "URL Empty String");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
    }, req), {
        "error": "Required field `images` is empty.",
        "warnings": [],
    }, "Images");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: [],
    }, req), {
        "error": "Required field `images` is empty.",
        "warnings": [],
    }, "Images Empty Array");
});

tap.test("Recommended Fields", {autoend: true}, (t) => {
    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
        },
        "warnings": [
            "Recommended field `title` is empty.",
            "Recommended field `objectType` is empty.",
        ],
    }, "Title and objectType recommended.");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "",
        objectType: "",
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
        },
        "warnings": [
            "Recommended field `title` is empty.",
            "Recommended field `objectType` is empty.",
        ],
    }, "Title and objectType recommended.");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
            title: "Test",
        },
        "warnings": [
            "Recommended field `objectType` is empty.",
        ],
    }, "objectType recommended.");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "",
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
            title: "Test",
        },
        "warnings": [
            "Recommended field `objectType` is empty.",
        ],
    }, "objectType recommended.");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
        },
        "warnings": [],
    }, "No recommended.");
});

tap.test("Type checking", {autoend: true}, (t) => {
    t.same(Artwork.lintData({
        id: 1234,
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `id` is empty.",
        "warnings": [
            "`id` is the wrong type. Expected a string.",
        ],
    }, "ID");

    t.same(Artwork.lintData({
        id: "1234",
        source: 1234,
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `source` is empty.",
        "warnings": [
            "`source` is the wrong type. Expected a string.",
        ],
    }, "Source");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: true,
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `lang` is empty.",
        "warnings": [
            "`lang` is the wrong type. Expected a string.",
        ],
    }, "Lang");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: {},
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `url` is empty.",
        "warnings": [
            "`url` is the wrong type. Expected a string.",
        ],
    }, "URL");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: {},
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `images` is empty.",
        "warnings": [
            "`images` is the wrong type. Expected a array.",
        ],
    }, "Images");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        dates: [
            {start: "1234", end: 1976},
        ],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            dates: [
                {end: 1976},
            ],
        },
        "warnings": [
            "`dates`: `start` is the wrong type. Expected a number.",
        ],
    }, "Date Start");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        dates: [
            {start: 1234, end: 1976, circa: "foo"},
        ],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            dates: [
                {start: 1234, end: 1976},
            ],
        },
        "warnings": [
            "`dates`: `circa` is the wrong type. Expected a boolean.",
        ],
    }, "Date Circa");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        categories: {},
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
        },
        "warnings": [
            "`categories` is the wrong type. Expected a array.",
        ],
    }, "Categories");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        categories: [true],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com/",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
        },
        "warnings": [
            "`categories` value is the wrong type. Expected a string.",
        ],
    }, "Categories Values");
});

tap.test("Validation", {autoend: true}, (t) => {
    t.same(Artwork.lintData({
        id: "1234/456",
        source: "nga",
        lang: "en",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `id` is empty.",
        "warnings": [
            "IDs can only contain letters, numbers, underscores, and hyphens.",
        ],
    }, "ID");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "foo",
        url: "http://google.com/",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `lang` is empty.",
        "warnings": [
            "`lang` must only be one of following languages: en, it, de.",
        ],
    }, "Lang");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http//google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `url` is empty.",
        "warnings": [
            "`url` must be properly-formatted URL.",
        ],
    }, "URL");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foojpg"],
        title: "Test",
        objectType: "painting",
    }, req), {
        "error": "Required field `images` is empty.",
        "warnings": [
            "Images must be a valid image file name. For example: `image.jpg`.",
        ],
    }, "Images");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "foo",
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
        },
        "warnings": [
            "`objectType` must be one of the following types: architecture, " +
                "decorative arts, drawing, fresco, medal, miniature, mosaic, " +
                "painting, photo, print, sculpture, stained glass.",
            "Recommended field `objectType` is empty.",
        ],
    }, "objectType");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{pseudonym: "Test"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
        },
        "warnings": [
            "`artists`: Required field `name` is empty.",
        ],
    }, "artists");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: [{width: 123}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
        },
        "warnings": [
            "Dimensions must have a unit specified and at least a width " +
                "or height.",
        ],
    }, "dimensions");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: [{unit: "mm"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
        },
        "warnings": [
            "Dimensions must have a unit specified and at least a width " +
                "or height.",
        ],
    }, "dimensions");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: [{width: 123, unit: "mm"}],
        dates: [{circa: true}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dimensions: [{width: 123, unit: "mm"}],
        },
        "warnings": [
            "Dates must have a start or end specified.",
        ],
    }, "dates");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: [{width: 123, unit: "mm"}],
        dates: [{start: 1456, end: 1457, circa: true}],
        locations: [{country: "United States"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dimensions: [{width: 123, unit: "mm"}],
            dates: [{start: 1456, end: 1457, circa: true}],
        },
        "warnings": [
            "Locations must have a name or city specified.",
        ],
    }, "locations");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: [{width: 123, unit: "mm"}],
        dates: [{start: 1456, end: 1457, circa: true}],
        locations: [{city: "New York City"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dimensions: [{width: 123, unit: "mm"}],
            dates: [{start: 1456, end: 1457, circa: true}],
            locations: [{city: "New York City"}],
        },
        "warnings": [],
    }, "All pass");
});

tap.test("Conversion", {autoend: true}, (t) => {
    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: ["Test"],
        dimensions: [{width: 123, unit: "mm"}],
        dates: [{start: 1456, end: 1457, circa: true}],
        locations: [{city: "New York City"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dimensions: [{width: 123, unit: "mm"}],
            dates: [{start: 1456, end: 1457, circa: true}],
            locations: [{city: "New York City"}],
        },
        "warnings": [],
    }, "Artists");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: ["123 x 100 cm"],
        dates: [{start: 1456, end: 1457, circa: true}],
        locations: [{city: "New York City"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dimensions: [{
                "original": "123 x 100 cm",
                height: 1230,
                width: 1000,
                unit: "mm",
            }],
            dates: [{start: 1456, end: 1457, circa: true}],
            locations: [{city: "New York City"}],
        },
        "warnings": [],
    }, "Dimensions");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: ["123"],
        dates: [{start: 1456, end: 1457, circa: true}],
        locations: [{city: "New York City"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dates: [{start: 1456, end: 1457, circa: true}],
            locations: [{city: "New York City"}],
        },
        "warnings": [
            "Dimensions must have a unit specified and at least a width" +
                " or height.",
        ],
    }, "Dimensions produce warnings");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: [{width: 123, unit: "mm"}],
        dates: ["ca. 1456-1457"],
        locations: [{city: "New York City"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dimensions: [{width: 123, unit: "mm"}],
            dates: [{
                start: 1456,
                end: 1457,
                circa: true,
                "original": "ca. 1456-1457",
            }],
            locations: [{city: "New York City"}],
        },
        "warnings": [],
    }, "Dates");

    t.same(Artwork.lintData({
        id: "1234",
        source: "nga",
        lang: "en",
        url: "http://google.com",
        images: ["foo.jpg"],
        title: "Test",
        objectType: "painting",
        artists: [{name: "Test"}],
        dimensions: [{width: 123, unit: "mm"}],
        dates: ["blah"],
        locations: [{city: "New York City"}],
    }, req), {
        data: {
            id: "1234",
            source: "nga",
            lang: "en",
            url: "http://google.com",
            images: ["nga/foo.jpg"],
            title: "Test",
            objectType: "painting",
            artists: [{name: "Test"}],
            dimensions: [{width: 123, unit: "mm"}],
            locations: [{city: "New York City"}],
        },
        "warnings": [
            "Dates must have a start or end specified.",
        ],
    }, "Dates produce warnings");
});

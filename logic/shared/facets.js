"use strict";

const pd = require("parse-dimensions");

const types = require("./types");

module.exports = (core) => ({
    source: {
        agg: {
            terms: {
                field: "source",
            },
        },
        name: (req) => req.gettext("Source"),
        url: (req, bucket) => req.searchURL({source: bucket.key}),
        text: (req, bucket) =>
            core.models.Source.getSource(bucket.key).name,
    },

    type: {
        agg: {
            terms: {
                field: "objectType.raw",
            },
        },
        name: (req) => req.gettext("Type"),
        url: (req, bucket) => req.searchURL({type: bucket.key}),
        text: (req, bucket) => (bucket.key in types ?
            types[bucket.key].name(req) : bucket.key),
    },

    date: {
        agg: (query) => {
            let ranges = [
                { to: 999 },
                { from: 1000, to: 1099 },
                { from: 1100, to: 1199 },
                { from: 1200, to: 1299 },
                { from: 1300, to: 1399 },
                { from: 1400, to: 1499 },
                { from: 1500, to: 1599 },
                { from: 1600, to: 1699 },
                { from: 1700, to: 1799 },
                { from: 1800 },
            ];

            const start = parseFloat(query.dateStart);
            const end = parseFloat(query.dateEnd);

            if (start && end && end - start < 300) {
                ranges = [];
                for (let year = start; year < end; year += 10) {
                    ranges.push({
                        from: year,
                        to: year + 9,
                    });
                }
            }

            return {
                range: {
                    field: "dates.years",
                    ranges: ranges,
                },
            };
        },
        name: (req) => req.gettext("Date"),
        url: (req, bucket) => req.searchURL({
            dateStart: bucket.from,
            dateEnd: bucket.to,
        }),
        text: (req, bucket) => req.numRange(bucket),
    },

    artist: {
        agg: {
            terms: {
                field: "artists.name.raw",
                size: 50,
            },
        },
        name: (req) => req.gettext("Artist"),
        url: (req, bucket) => req.searchURL({artist: bucket.key}),
        text: (req, bucket) => bucket.key,
    },

    width: {
        agg: {
            range: {
                field: "dimensions.width",
                ranges: [
                    { to: 99 },
                    { from: 100, to: 199 },
                    { from: 200, to: 299 },
                    { from: 300, to: 399 },
                    { from: 400, to: 499 },
                    { from: 500, to: 599 },
                    { from: 600, to: 699 },
                    { from: 700, to: 799 },
                    { from: 800, to: 899 },
                    { from: 900, to: 999 },
                    { from: 1000, to: 1249 },
                    { from: 1250, to: 1599 },
                    { from: 1500, to: 1749 },
                    { from: 1750, to: 1999 },
                    { from: 2000 },
                ],
            },
        },
        name: (req) => req.gettext("Width"),
        url: (req, bucket) => {
            const unit = req.unit();
            return req.searchURL({
                widthMin: pd.convertNumber(bucket.from, "mm", unit),
                widthMax: pd.convertNumber(bucket.to, "mm", unit),
                unit,
            });
        },
        text: (req, bucket) => {
            const unit = req.unit();
            return req.numRange({
                from: pd.convertNumber(bucket.from, "mm", unit),
                to: pd.convertNumber(bucket.to, "mm", unit),
                unit,
            });
        },
    },

    height: {
        agg: {
            range: {
                field: "dimensions.height",
                ranges: [
                    { to: 99 },
                    { from: 100, to: 199 },
                    { from: 200, to: 299 },
                    { from: 300, to: 399 },
                    { from: 400, to: 499 },
                    { from: 500, to: 599 },
                    { from: 600, to: 699 },
                    { from: 700, to: 799 },
                    { from: 800, to: 899 },
                    { from: 900, to: 999 },
                    { from: 1000, to: 1249 },
                    { from: 1250, to: 1599 },
                    { from: 1500, to: 1749 },
                    { from: 1750, to: 1999 },
                    { from: 2000 },
                ],
            },
        },
        name: (req) => req.gettext("Height"),
        url: (req, bucket) => {
            const unit = req.unit();
            return req.searchURL({
                heightMin: pd.convertNumber(bucket.from, "mm", unit),
                heightMax: pd.convertNumber(bucket.to, "mm", unit),
                unit,
            });
        },
        text: (req, bucket) => {
            const unit = req.unit();
            return req.numRange({
                from: pd.convertNumber(bucket.from, "mm", unit),
                to: pd.convertNumber(bucket.to, "mm", unit),
                unit,
            });
        },
    },
});

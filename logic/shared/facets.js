"use strict";

module.exports = (core, app) => {
    const Source = core.models.Source;

    return {
        source: {
            agg: {
                terms: {
                    field: "source",
                },
            },
            name: (res) => res.locals.gettext("Sources"),
            url: (res, bucket) => res.locals.searchURL("source", bucket.key),
            text: (res, bucket) => Source.getSource(bucket.key).name,
        },

        artist: {
            agg: {
                terms: {
                    field: "artists.name.raw",
                    size: 50,
                },
            },
            name: (res) => res.locals.gettext("Artists"),
            url: (res, bucket) => res.locals.searchURL("artist", bucket.key),
            text: (res, bucket) => bucket.key,
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
            name: (res) => res.locals.gettext("Width (mm)"),
            url: (res, bucket) => res.locals.searchURL({
                widthMin: bucket.from,
                widthMax: bucket.to,
            }),
            text: (res, bucket) => bucket.to ?
                `${bucket.from || 0}-${bucket.to}` :
                `${bucket.from}+`,
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
            name: (res) => res.locals.gettext("Height (mm)"),
            url: (res, bucket) => res.locals.searchURL({
                heightMin: bucket.from,
                heightMax: bucket.to,
            }),
            text: (res, bucket) => bucket.to ?
                `${bucket.from || 0}-${bucket.to}` :
                `${bucket.from}+`,
        },
    };
};

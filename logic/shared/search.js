"use strict";

const models = require("../../lib/models");
const urls = require("../../lib/urls");
const config = require("../../lib/config");

const facets = require("./facets");
const queries = require("./queries");
const searchURL = require("./search-url");
const paramFilter = require("./param-filter");

const sorts = config.sorts;
const types = config.types;

module.exports = (req, res, tmplParams) => {
    // Collect all the values from the request to construct
    // the search URL and matches later
    const query = {};
    const fields = Object.assign({}, req.query, req.params);

    for (const name in queries) {
        let value = queries[name].value(fields);

        if (!value && queries[name].defaultValue) {
            value = queries[name].defaultValue();
        }

        if (value !== undefined) {
            query[name] = value;
        }
    }

    const curURL = urls.gen(req.lang, req.originalUrl);
    const expectedURL = searchURL(req, query, true);

    if (expectedURL !== curURL) {
        return res.redirect(expectedURL);
    }

    // Generate the filters which will be fed in to Elasticsearch
    // to build the query filter
    const matches = Object.keys(queries)
        .map((name) => query[name] && queries[name].filters &&
            queries[name].filter(query))
        .filter((match) => match);

    // Construct the facets that will be put in to Elasticsearch
    // (called aggregations)
    const aggregations = Object.keys(facets).reduce((obj, name) => {
        const agg = facets[name].agg;
        obj[name] = (typeof agg === "function" ? agg(query) : agg);
        return obj;
    }, {});

    // Query for the artworks in Elasticsearch
    models("Artwork").search({
        bool: {
            must: matches,
        },
    }, {
        size: query.rows,
        from: query.start,
        aggs: aggregations,
        sort: sorts[query.sort].sort,
        hydrate: true,
    }, (err, results) => {
        /* istanbul ignore if */
        if (err) {
            return res.status(500).render("Error", {
                title: err.message,
            });
        }

        // The number of the last item in this result set
        const end = query.start + results.hits.hits.length;

        // The link to the previous page of search results
        const prevLink = (query.start > 0 ? searchURL(req, {
            start: (query.start - query.rows > 0 ?
                (query.start - query.rows) : ""),
        }, true) : "");

        // The link to the next page of the search results
        const nextLink = (end < results.hits.total ?
            searchURL(req, {start: query.start + query.rows}, true) : "");

        // Construct a nicer form of the facet data to feed in to
        // the templates
        const facetData = Object.keys(facets).map((name) => ({
            name: facets[name].name(req),
            buckets: results.aggregations[name].buckets.map((bucket) => ({
                text: facets[name].text(req, bucket),
                url: searchURL(req, facets[name].url(req, bucket)),
                count: bucket.doc_count,
            })).filter((bucket) => bucket.count > 0),
        }))
        .filter((facet) => facet.buckets.length > 1);

        // Make sure that there aren't too many buckets displaying at
        // any one time, otherwise it gets too long. We mitigate this
        // by splitting the extra buckets into a separate container
        // and then allow the user to toggle its visibility.
        facetData.forEach((facet) => {
            if (facet.buckets.length > 10) {
                facet.extra = facet.buckets.slice(5);
                facet.buckets = facet.buckets.slice(0, 5);
            }
        });

        // Construct a list of the possible sorts, their translated
        // names and their selected state, for the template.
        const sortData = Object.keys(sorts).map((id) => ({
            id: id,
            name: sorts[id].name(req),
            selected: query.sort === id,
        }));

        // Construct a list of the possible types, their translated
        // names and their selected state, for the template.
        const typeData = Object.keys(types).map((id) => ({
            id: id,
            name: types[id].name(req),
            selected: query.type === id,
        }));

        // Figure out the title of the results
        let title = req.gettext("Search Results");
        const primary = paramFilter(req).primary;

        if (primary.length === 1 && queries[primary[0]].title) {
            title = queries[primary[0]].title(req, query);
        } else if (primary.length === 0) {
            title = req.gettext("All Artworks");
        }

        // Compute the breadcrumbs
        let breadcrumbs = [];

        if (primary.length > 1) {
            breadcrumbs = primary.map((param) => {
                const rmQuery = Object.assign({}, query);
                rmQuery[param] = null;

                // If the param has a pair, remove that too
                if (queries[param].pair) {
                    rmQuery[queries[param].pair] = null;
                }

                return {
                    name: queries[param].title &&
                        queries[param].title(req, query),
                    url: searchURL(req, rmQuery),
                };
            }).filter((crumb) => crumb.name);
        }

        res.render("Search", Object.assign({
            title,
            breadcrumbs,
            sources: models("Source").getSources()
                .filter((source) => source.numArtworks > 0),
            types: typeData,
            minDate: config.DEFAULT_START_DATE,
            maxDate: config.DEFAULT_END_DATE,
            query,
            queries,
            sorts: sortData,
            facets: facetData,
            artworks: results.hits.hits,
            total: results.hits.total,
            start: (results.hits.total > 0 ? query.start + 1 : 0),
            end,
            prev: prevLink,
            next: nextLink,
            // Don't index the search results
            noIndex: true,
        }, tmplParams));
    });
};

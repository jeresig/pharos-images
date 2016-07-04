"use strict";

const sanitize = require("elasticsearch-sanitize");

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
    const values = {};
    const fields = Object.assign({}, req.query, req.params);

    for (const name in queries) {
        let value = queries[name].value(fields);

        if (!value && queries[name].defaultValue) {
            value = queries[name].defaultValue();
        }

        if (value !== undefined) {
            values[name] = value;
        }
    }

    const curURL = urls.gen(req.lang, req.originalUrl);
    const expectedURL = searchURL(req, values, true);

    if (expectedURL !== curURL) {
        return res.redirect(expectedURL);
    }

    // Generate the filters and facets which will be fed in to Elasticsearch
    // to build the query filter and aggregations
    const filters = [];
    const aggregations = {};

    for (const name in values) {
        const query = queries[name];
        const facet = facets[name];
        const value = values[name];

        if (query.filter) {
            filters.push(query.filter(value, sanitize));
        }

        if (facet && facet.facet) {
            aggregations[name] = facet.facet(value);
        }
    }

    // Query for the artworks in Elasticsearch
    models("Artwork").search({
        bool: {
            must: filters,
        },
    }, {
        size: values.rows,
        from: values.start,
        aggs: aggregations,
        sort: sorts[values.sort].sort,
        hydrate: true,
    }, (err, results) => {
        /* istanbul ignore if */
        if (err) {
            return res.status(500).render("Error", {
                title: err.message,
            });
        }

        // The number of the last item in this result set
        const end = values.start + results.hits.hits.length;

        // The link to the previous page of search results
        const prevStart = values.start - values.rows;
        const prevLink = (values.start > 0 ? searchURL(req, {
            start: (prevStart > 0 ? prevStart : ""),
        }, true) : "");

        // The link to the next page of the search results
        const nextStart = values.start + values.rows;
        const nextLink = (end < results.hits.total ? searchURL(req, {
            start: nextStart,
        }, true) : "");

        // Construct a nicer form of the facet data to feed in to
        // the templates
        const facetData = [];

        for (const name in aggregations) {
            const facet = facets[name];
            const buckets = results.aggregations[name].buckets
                .map((bucket) => {
                    const formattedBucket = facet.formatFacetBucket(bucket,
                        searchURL, req);
                    formattedBucket.count = bucket.doc_count;
                    return formattedBucket;
                })
                .filter((bucket) => bucket.count > 0);

            // Skip facets that won't filter anything
            if (buckets.length <= 1) {
                continue;
            }

            const result = {
                name: facet.name(req),
                buckets,
            };

            // Make sure that there aren't too many buckets displaying at
            // any one time, otherwise it gets too long. We mitigate this
            // by splitting the extra buckets into a separate container
            // and then allow the user to toggle its visibility.
            if (result.buckets.length > 10) {
                result.extra = result.buckets.slice(5);
                result.buckets = result.buckets.slice(0, 5);
            }

            facetData.push(result);
        }

        // Construct a list of the possible sorts, their translated
        // names and their selected state, for the template.
        // TODO: Rewrite this to use the models
        const sortData = Object.keys(sorts).map((id) => ({
            id: id,
            name: sorts[id].name(req),
            selected: values.sort === id,
        }));

        // Construct a list of the possible types, their translated
        // names and their selected state, for the template.
        // TODO: Find another way to generate this
        const typeData = Object.keys(types).map((id) => ({
            id: id,
            name: types[id].name(req),
            selected: values.type === id,
        }));

        // Figure out the title and breadcrumbs of the results
        let title = req.gettext("Search Results");
        const primary = paramFilter(req).primary;
        let breadcrumbs = [];

        if (primary.length > 1) {
            // TODO: Rewrite breadcrumb handling/generation
            breadcrumbs = [];
            /*
            primary.map((param) => {
                const rmValues = Object.assign({}, values);
                delete rmValues[param];

                return {
                    name: queries[param].title &&
                        queries[param].title(req, query),
                    url: searchURL(rmValues),
                };
            }).filter((crumb) => crumb.name);
            */

        } else if (primary.length === 1) {
            const name = primary[0];
            const query = queries[name];
            title = query.searchTitle(values[name], req);

        } else {
            title = req.gettext("All Artworks");
        }

        res.render("Search", Object.assign({
            title,
            breadcrumbs,
            sources: models("Source").getSources()
                .filter((source) => source.numArtworks > 0),
            types: typeData,
            minDate: config.DEFAULT_START_DATE,
            maxDate: config.DEFAULT_END_DATE,
            values,
            queries,
            sorts: sortData,
            facets: facetData,
            artworks: results.hits.hits,
            total: results.hits.total,
            start: (results.hits.total > 0 ? values.start + 1 : 0),
            end,
            prev: prevLink,
            next: nextLink,
            // Don't index the search results
            noIndex: true,
        }, tmplParams));
    });
};

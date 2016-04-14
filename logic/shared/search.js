"use strict";

const models = require("../../lib/models");
const urls = require("../../lib/urls");

const facets = require("./facets");
const queries = require("./queries");
const sorts = require("./sorts");
const types = require("./types");

module.exports = (req, res, tmplParams) => {
    // Build the query object which will be used to construct
    // the search URL and matches later
    const query = Object.keys(queries).reduce((obj, name) => {
        obj[name] = queries[name].value(req) ||
            (queries[name].defaultValue &&
                queries[name].defaultValue(req));
        return obj;
    }, {});

    const curURL = urls.gen(req.lang, req.originalUrl);
    const expectedURL = req.searchURL(query, true);

    if (expectedURL !== curURL) {
        return res.redirect(expectedURL);
    }

    // Generate the matches which will be fed in to Elasticsearch
    // to build the query matching
    const matches = Object.keys(queries)
        .map((name) => query[name] && queries[name].match &&
            queries[name].match(query))
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
            console.error(err);
            return res.status(500).render("error", {
                title: err.message,
            });
        }

        // Expose the query object to the templates and to the
        // searchURL and paramFilter methods.
        res.locals.query = query;

        // The number of the last item in this result set
        const end = query.start + results.hits.hits.length;

        // The link to the previous page of search results
        const prevLink = (query.start > 0 && req.searchURL({
            start: (query.start - query.rows > 0 ?
                (query.start - query.rows) : ""),
        }, true));

        // The link to the next page of the search results
        const nextLink = (end < results.hits.total &&
            req.searchURL({start: query.start + query.rows}, true));

        // Construct a nicer form of the facet data to feed in to
        // the templates
        const facetData = Object.keys(facets).map((name) => ({
            name: facets[name].name(req),
            buckets: results.aggregations[name].buckets.map((bucket) => ({
                text: facets[name].text(req, bucket),
                url: facets[name].url(req, bucket),
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
        const params = req.paramFilter(query);

        if (params.primary.length === 1 &&
                queries[params.primary[0]].title) {
            title = queries[params.primary[0]].title(req, query);
        } else if (params.primary.length === 0) {
            title = req.gettext("All Artworks");
        }

        // Compute the breadcrumbs
        let breadcrumbs = [];

        if (params.primary.length > 1) {
            breadcrumbs = params.primary.map((param) => {
                const rmQuery = Object.assign({}, query);
                rmQuery[param] = null;

                // If the param has a pair, remove that too
                if (queries[param].pair) {
                    rmQuery[queries[param].pair] = null;
                }

                return {
                    name: queries[param].title &&
                        queries[param].title(req, query),
                    url: req.searchURL(rmQuery),
                };
            }).filter((crumb) => crumb.name);
        }

        res.render("search", Object.assign({
            title,
            breadcrumbs,
            sources: models("Source").getSources(),
            types: typeData,
            minDate: process.env.DEFAULT_START_DATE || "",
            maxDate: process.env.DEFAULT_END_DATE || "",
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

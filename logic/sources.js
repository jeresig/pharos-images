"use strict";

module.exports = (core, app) => {
    const Source = core.models.Source;
    const search = require("./shared/search")(core, app);

    return {
        show(req, res) {
            search(req, res, {
                title: req.source.getFullName(res.locals.lang),
                desc: req.format(req.gettext("Artworks at the %(source)s."),
                    {source: req.source.getFullName(res.locals.lang)}),
                url: req.source.url,
            });
        },

        load(req, res, next, id) {
            req.source = Source.getSource(id);
            next();
        },
    };
};

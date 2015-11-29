"use strict";

module.exports = (core, app) => {
    const Source = core.models.Source;
    const search = require("./shared/search")(core, app);

    return {
        show(req, res) {
            search(req, res, {
                title: req.source.getFullName(req.i18n.getLocale()),
                desc: req.i18n.__("Artworks at the %s.",
                    req.source.getFullName(req.i18n.getLocale())),
                url: req.source.url,
            });
        },

        load(req, res, next, id) {
            req.source = Source.getSource(id);
            next();
        },
    };
};

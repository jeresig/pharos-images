"use strict";

module.exports = function(core, app) {
    const Source = core.models.Source;

    return {
        admin(req, res) {
            let source;

            try {
                source = Source.getSource(req.params.source);

            } catch (e) {
                return res.status(404).render("error", {
                    title: req.gettext("Source not found."),
                });
            }

            res.render("admin", {
                source,
            });
        },

        routes() {
            app.get("/source/:source/admin", this.admin);
        },
    };
};

"use strict";

module.exports = {
    getShortTitle() {
        return "PHAROS";
    },

    getSubTitle(req) {
        return req.gettext("Art Research Database");
    },

    getTitle(req) {
        return `${this.getShortTitle(req)}: ${this.getSubTitle(req)}`;
    },
};

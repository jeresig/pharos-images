"use strict";

const db = require("./db");
const config = require("./config");

const model = config.model;

module.exports = {
    schemas() {
        const modelProps = {};

        for (const modelName in model) {
            modelProps[modelName] = model[modelName].schema(db.schema);
        }

        return modelProps;
    },
};

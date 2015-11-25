"use strict";

const React = require("react");
const DefaultLayout = require("../layouts/default");

module.exports = React.createClass({
    render() {
        return <DefaultLayout title={"Hello!"}>
            <strong>Some contents...</strong>
        </DefaultLayout>;
    },
});

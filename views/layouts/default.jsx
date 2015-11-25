"use strict";

const React = require("react");

module.exports = React.createClass({
    render() {
        return <html>
            <head>
                <title>{this.props.title}</title>
            </head>
            <body>
                <h1>{this.props.title}</h1>
            </body>
        </html>;
    },
});

"use strict";

const React = require("react");

module.exports = React.createClass({
    propTypes: {
        body: React.PropTypes.string,
        title: React.PropTypes.string.isRequired,
    },

    render() {
        return <div>
            <h1>{this.props.title}</h1>
            <pre>{this.props.body}</pre>
        </div>;
    },
});

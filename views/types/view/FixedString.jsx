"use strict";

const React = require("react");

const FixedStringView = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        searchURL: React.PropTypes.func.isRequired,
        value: React.PropTypes.string.isRequired,
    },

    render() {
        if (!this.props.value) {
            return;
        }

        return <a href={this.props.searchURL(
            {[this.props.name]: this.props.value})}
        >
            {this.props.value}
        </a>;
    },
});

module.exports = FixedStringView;

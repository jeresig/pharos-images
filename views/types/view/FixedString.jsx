"use strict";

const React = require("react");

const FixedStringView = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        searchURL: React.PropTypes.func.isRequired,
        title: React.PropTypes.string,
        value: React.PropTypes.string.isRequired,
    },

    render() {
        if (!this.props.value) {
            return null;
        }

        const title = this.props.title || this.props.value;

        return <a href={this.props.searchURL(
            {[this.props.name]: this.props.value})}
        >
            {title}
        </a>;
    },
});

module.exports = FixedStringView;

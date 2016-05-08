"use strict";

const React = require("react");

const FixedStringView = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        searchField: React.PropTypes.string,
        searchURL: React.PropTypes.func.isRequired,
        value: React.PropTypes.string.isRequired,
        values: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                id: React.PropTypes.string.isRequired,
                name: React.PropTypes.string.isRequired,
            })
        ),
    },

    getTitle(value) {
        if (!this.props.values) {
            return value;
        }

        for (const map of this.props.values) {
            if (map.id === value) {
                return map.name;
            }
        }

        return value;
    },

    renderValue(value) {
        if (!value) {
            return null;
        }

        const field = this.props.searchField || this.props.name;
        const title = this.getTitle(value);

        return <a href={this.props.searchURL({[field]: value})}>
            {title}
        </a>;
    },

    render() {
        return this.renderValue(this.props.value);
    },
});

module.exports = FixedStringView;

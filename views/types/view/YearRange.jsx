"use strict";

const React = require("react");

const getDate = (item) => {
    if (item.original) {
        return item.original;
    }

    if (item.start || item.end) {
        return (item.circa ? "ca. " : "") +
            item.start + (item.end && item.end !== item.start ?
            `-${item.end}` : "");
    }

    return "";
};

const YearRangeView = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        searchURL: React.PropTypes.func.isRequired,
        value: React.PropTypes.string.isRequired,
    },

    renderDate(date) {
        return <span key={date._id}>
            <a href={this.props.searchURL({
                [`${this.props.name}.start`]: date.start,
                [`${this.props.name}.end`]: date.end,
            })}
            >
                {getDate(date)}
            </a><br/>
        </span>;
    },

    render() {
        return <span>
            {this.props.value.map((date) => this.renderDate(date))}
        </span>;
    },
});

module.exports = YearRangeView;

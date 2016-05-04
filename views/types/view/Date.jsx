"use strict";

const React = require("react");

const DateView = React.createClass({
    propTypes: {
        getDate: React.PropTypes.func.isRequired,
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
                {this.props.getDate(date)}
            </a><br/>
        </span>;
    },

    render() {
        return <span>
            {this.props.value.map((date) => this.renderDate(date))}
        </span>;
    },
});

module.exports = DateView;

"use strict";

const React = require("react");

const DimensionView = React.createClass({
    propTypes: {
        getDimension: React.PropTypes.func.isRequired,
        name: React.PropTypes.string.isRequired,
        searchURL: React.PropTypes.func.isRequired,
        value: React.PropTypes.string.isRequired,
    },

    renderDimension(dimension) {
        return <span key={dimension._id}>
            {this.props.getDimension(dimension)}<br/>
        </span>;
    },

    render() {
        return <span>
            {this.props.value.map((dimension) =>
                this.renderDimension(dimension))}
        </span>;
    },
});

module.exports = DimensionView;

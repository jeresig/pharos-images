"use strict";

const React = require("react");

const DimensionView = React.createClass({
    propTypes: {
        getDimension: React.PropTypes.func.isRequired,
        name: React.PropTypes.string.isRequired,
        value: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                _id: React.PropTypes.string.isRequired,
                height: React.PropTypes.number,
                width: React.PropTypes.number,
                unit: React.PropTypes.string,
            })
        ).isRequired,
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

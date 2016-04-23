"use strict";

const React = require("react");

const LocationFilter = React.createClass({
    propTypes: {
        placeholder: React.PropTypes.string,
        title: React.PropTypes.string.isRequired,
        value: React.PropTypes.string,
    },

    render() {
        return <div className="form-group">
            <label htmlFor="location" className="control-label">
                {this.props.title}
            </label>
            <input type="text" name="location"
                placeholder={this.props.placeholder}
                defaultValue={this.props.value}
                className="form-control"
            />
        </div>;
    },
});

module.exports = LocationFilter;

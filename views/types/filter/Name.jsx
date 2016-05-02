"use strict";

const React = require("react");

const NameFilter = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        placeholder: React.PropTypes.string,
        title: React.PropTypes.string.isRequired,
        value: React.PropTypes.string,
    },

    render() {
        return <div className="form-group">
            <label htmlFor={this.props.name} className="control-label">
                {this.props.title}
            </label>
            <input type="text" name={this.props.name}
                placeholder={this.props.placeholder}
                defaultValue={this.props.value}
                className="form-control"
            />
        </div>;
    },
});

module.exports = NameFilter;

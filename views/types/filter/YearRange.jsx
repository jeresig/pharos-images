"use strict";

const React = require("react");

const dateRangeType = React.PropTypes.shape({
    end: React.PropTypes.number,
    start: React.PropTypes.number,
});

const YearRangeFilter = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        placeholder: dateRangeType,
        title: React.PropTypes.string.isRequired,
        value: dateRangeType,
    },

    getDefaultProps() {
        return {
            placeholder: {},
            value: {},
        };
    },

    render() {
        return <div className="form-group">
            <label htmlFor={this.props.name} className="control-label">
                {this.props.title}
            </label>
            <div className="form-inline">
                <input type="text" name={`${this.props.name}.start`}
                    defaultValue={this.props.value.start}
                    placeholder={this.props.placeholder.start}
                    className="form-control date-control"
                />
                &mdash;
                <input type="text" name={`${this.props.name}.end`}
                    defaultValue={this.props.value.end}
                    placeholder={this.props.placeholder.end}
                    className="form-control date-control"
                />
            </div>
        </div>;
    },
});

module.exports = YearRangeFilter;

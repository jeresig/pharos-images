"use strict";

const React = require("react");

const DimensionFilter = React.createClass({
    propTypes: {
        heightTitle: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        placeholder: React.PropTypes.shape({
            end: React.PropTypes.number,
            start: React.PropTypes.number,
        }),
        value: React.PropTypes.string,
        widthTitle: React.PropTypes.string.isRequired,
    },

    render() {
        return <div className="row">
            <div className="form-group col-xs-6 col-sm-12 col-lg-6">
                <label htmlFor={`${this.props.name}.width.min`}
                    className="control-label"
                >
                    {this.props.widthTitle}
                </label>
                <div className="form-inline">
                    <input type="text" name={`${this.props.name}.width.min`}
                        defaultValue={this.props.value.width.min}
                        placeholder="10"
                        className="form-control size-control"
                    />
                    &mdash;
                    <input type="text" name={`${this.props.name}.height.max`}
                        defaultValue={this.props.value.width.max}
                        placeholder="200"
                        className="form-control size-control"
                    />
                </div>
            </div>
            <div className="form-group col-xs-6 col-sm-12 col-lg-6">
                <label htmlFor={`${this.props.name}.height.min`}
                    className="control-label"
                >
                    {this.props.heightTitle}
                </label>
                <div className="form-inline">
                    <input type="text" name={`${this.props.name}.height.min`}
                        defaultValue={this.props.value.width.minmin}
                        placeholder="10"
                        className="form-control size-control"
                    />
                    &mdash;
                    <input type="text" name={`${this.props.name}.height.max`}
                        defaultValue={this.props.value.width.max}
                        placeholder="200"
                        className="form-control size-control"
                    />
                </div>
            </div>
        </div>;
    },
});

module.exports = DimensionFilter;

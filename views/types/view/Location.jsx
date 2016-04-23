"use strict";

const React = require("react");

const LocationView = React.createClass({
    propTypes: {
        locations: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                _id: React.PropTypes.string.isRequired,
                city: React.PropTypes.string,
                name: React.PropTypes.string,
            })
        ).isRequired,
        name: React.PropTypes.string.isRequired,
        searchURL: React.PropTypes.func.isRequired,
    },

    renderName(location) {
        const url = this.props.searchURL({[this.props.name]: location.name});

        return <span>
            <a href={url}>{location.name}</a><br/>
        </span>;
    },

    render() {
        return <div>
            {this.prop.locations.map((location) => <span key={location._id}>
                {location.name && this.renderName(location)}
                {location.city && <span>{location.city}<br/></span>}
            </span>)}
        </div>;
    },
});

module.exports = LocationView;

"use strict";

const React = require("react");

const NameView = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        names: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                _id: React.PropTypes.string.isRequired,
                name: React.PropTypes.string.isRequired,
                pseudonym: React.PropTypes.string,
            })
        ).isRequired,
        searchURL: React.PropTypes.func.isRequired,
    },

    renderName(name) {
        const url = this.props.searchURL({[this.props.name]: name.name});
        const pseudoURL = this.props.searchURL({[this.props.name]:
            name.pseudoynm});

        return <span key={name._id}>
            <a href={url}>{name.name}</a>
            {name.pseudonym && (<a href={pseudoURL}>{name.pseudonym}</a>)}
        </span>;
    },

    render() {
        return <div>
            {this.prop.names.map((name) => this.renderName(name))}
        </div>;
    },
});

module.exports = NameView;

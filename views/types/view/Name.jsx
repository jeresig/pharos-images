"use strict";

const React = require("react");

const NameView = React.createClass({
    propTypes: {
        name: React.PropTypes.string.isRequired,
        searchURL: React.PropTypes.func.isRequired,
        value: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                _id: React.PropTypes.string.isRequired,
                name: React.PropTypes.string.isRequired,
                pseudonym: React.PropTypes.string,
            })
        ).isRequired,
    },

    renderPseudonym(name) {
        if (!name.pseudoynm || name.name === name.pseudoynm) {
            return null;
        }

        const pseudoURL = this.props.searchURL({filter: name.pseudonym});

        return <span>
            {" "}(<a href={pseudoURL}>{name.pseudonym}</a>)
        </span>;
    },

    renderName(name) {
        const url = this.props.searchURL({[this.props.name]: name.name});

        return <span key={name._id}>
            <a href={url}>{name.name}</a>
            {this.renderPseudonym(name)}
        </span>;
    },

    render() {
        return <div>
            {this.props.value.map((name) => this.renderName(name))}
        </div>;
    },
});

module.exports = NameView;

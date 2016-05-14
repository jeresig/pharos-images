"use strict";

const React = require("react");

const config = require("../lib/config");

const Page = require("./Page.jsx");

const Home = React.createClass({
    propTypes: {
        URL: React.PropTypes.func.isRequired,
        artworkTotal: React.PropTypes.number.isRequired,
        format: React.PropTypes.func.isRequired,
        getTitle: React.PropTypes.func.isRequired,
        getShortTitle: React.PropTypes.func.isRequired,
        getSubTitle: React.PropTypes.func.isRequired,
        gettext: React.PropTypes.func.isRequired,
        imageTotal: React.PropTypes.number.isRequired,
        lang: React.PropTypes.string.isRequired,
        sources: React.PropTypes.arrayOf(
            React.PropTypes.any
        ).isRequired,
        stringNum: React.PropTypes.func.isRequired,
    },

    renderSplash() {
        return <div>
            <div className="home-splash">
                <div className="splash-contents">
                    <img src={this.props.URL("/images/lighthouse.md.png")}
                        alt={this.props.getTitle(config.siteName)}
                        width="200" height="203"
                        className="hidden-xs"
                    />
                    <h1>
                        {this.props.getShortTitle(config.siteName)}<br/>
                        {this.props.getSubTitle(config.siteName)}</h1>
                </div>
            </div>
            <div className="home-splash-offset"></div>
        </div>;
    },

    renderSearchForm() {
        // TODO: Change to use a generic term
        const title = this.props.format(
            this.props.gettext(
                "Search %(artworkCount)s Artworks and %(imageCount)s Images:"),
            {
                artworkCount: this.props.stringNum(this.props.artworkTotal),
                imageCount: this.props.stringNum(this.props.imageTotal),
            }
        );

        return <div>
            <h3>{title}</h3>
            <form action={this.props.URL("/search")} method="GET"
                className="form-search search form-inline"
            >
                <div className="form-group">
                    <input type="hidden" name="lang" value={this.props.lang} />
                    <input type="search" id="filter" name="filter"
                        placeholder={this.props.gettext("Search")}
                        className="form-control search-query"
                    />
                </div>
                {" "}
                <input type="submit" value={this.props.gettext("Search")}
                    className="btn btn-primary"
                />
                {" "}
                <a href={this.props.URL("/search")} className="btn btn-default">
                    {this.props.gettext("Browse All")}
                </a>
            </form>
        </div>;
    },

    renderImageUploadForms() {
        return <div>
            <h3>{this.props.gettext("Search by Image:")}</h3>
            <p>{this.props.gettext("Upload an image to find other " +
                "similar images.")}</p>

            <div className="panel panel-default">
                <div className="panel-heading">
                    <h3 className="panel-title">
                        {this.props.gettext("Upload an Image")}
                    </h3>
                </div>
                <div className="panel-body">
                    <form action={this.props.URL("/file-upload")} method="POST"
                        encType="multipart/form-data"
                    >
                        <input type="hidden" name="lang"
                            value={this.props.lang}
                        />
                        <div className="form-inline">
                            <div className="form-group">
                                <input type="file" id="file" name="file"
                                    className="form-control"
                                />
                            </div>
                            {" "}
                            <input type="submit" className="btn btn-primary"
                                value={this.props.gettext("Search by Image")}
                            />
                        </div>
                    </form>
                </div>
            </div>

            <div className="panel panel-default">
                <div className="panel-heading">
                    <h3 className="panel-title">
                        {this.props.gettext("Paste Image URL")}
                    </h3>
                </div>
                <div className="panel-body">
                    <form action={this.props.URL("/url-upload")} method="GET">
                        <input type="hidden" name="lang"
                            value={this.props.lang}
                        />
                        <div className="form-inline">
                            <div className="form-group">
                                <input type="text" id="url" name="url"
                                    defaultValue="http://"
                                    className="form-control"
                                />
                            </div>
                            {" "}
                            <input type="submit"
                                value={this.props.gettext("Search by Image")}
                                className="btn btn-primary"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>;
    },

    renderSources() {
        return <div>
            <h3>{this.props.gettext("Browse by Collection:")}</h3>

            <div className="sources">
                {this.props.sources.map((source) => this.renderSource(source))}
            </div>
        </div>;
    },

    renderSource(source) {
        // TODO: Switch to use generic term
        const desc = this.props.format(
            this.props.gettext(
                "%(artworkCount)s Artworks, %(imageCount)s Images"),
            {
                artworkCount: this.props.stringNum(source.numArtworks),
                imageCount: this.props.stringNum(source.numImages),
            }
        );

        return <div key={source._id}>
            <h4><a href={source.getURL(this.props.lang)}>
                {source.getFullName(this.props.lang)}
            </a></h4>
            <p>{desc}</p>
        </div>;
    },

    render() {
        return <Page
            {...this.props}
            splash={this.renderSplash()}
        >
            <div className="col-sm-8 col-sm-offset-2 upload-box">
                {this.renderSearchForm()}
                {this.renderImageUploadForms()}
                {this.renderSources()}
            </div>
        </Page>;
    },
});

module.exports = Home;

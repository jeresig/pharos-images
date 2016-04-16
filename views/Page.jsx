"use strict";

const React = require("react");

const config = require("../lib/config");
const locales = require("../config/locales.json");

module.exports = React.createClass({
    propTypes: {
        URL: React.PropTypes.func.isRequired,
        children: React.PropTypes.any,
        desc: React.PropTypes.string,
        getOtherURL: React.PropTypes.func.isRequired,
        gettext: React.PropTypes.func.isRequired,
        lang: React.PropTypes.string.isRequired,
        noIndex: React.PropTypes.bool,
        scripts: React.PropTypes.any,
        social: React.PropTypes.shape({
            url: React.PropTypes.string.isRequired,
            title: React.PropTypes.string.isRequired,
            imgURL: React.PropTypes.string.isRequired,
        }),
        splash: React.PropTypes.any,
        style: React.PropTypes.any,
        title: React.PropTypes.string.isRequired,
    },

    renderHead() {
        const URL = this.props.URL;
        const desc = this.props.desc;
        let title = `${config.SITE_NAME_SHORT}: ${config.SITE_NAME}`;

        if (this.props.title) {
            title = `${this.props.title} - ${config.SITE_NAME_SHORT}: ` +
                `${config.SITE_NAME}`;
        }

        // An option to disable indexing of this page
        const noIndex = !!config.NO_INDEX || this.props.noIndex;

        return <head>
            <meta httpEquiv="content-type" content="text/html; charset=utf-8"/>
            <meta httpEquiv="content-language" content={this.props.lang}/>
            <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
            <meta name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            {noIndex && <meta name="robots" content="noindex"/>}
            <link rel="icon" type="image/x-icon"
                href={URL("/images/favicon.png")}
            />
            <title>{title}</title>
            {desc && <meta name="description" content={desc}/>}
            {this.props.social && this.renderSocialMeta()}
            <link rel="stylesheet" href={URL("/css/bootstrap.min.css")}/>
            <link rel="stylesheet"
                href={URL("/css/bootstrap-theme.min.css")}
            />
            <link rel="stylesheet" href={URL("/css/style.css")}/>
            {this.props.style}
        </head>;
    },

    renderSocialMeta() {
        const social = this.props.social;
        return [
            <meta name="twitter:card" content="photo"/>,
            <meta name="twitter:url" content={social.url}/>,
            <meta name="twitter:title" content={social.title}/>,
            <meta name="twitter:image" content={social.imgURL}/>,
            <meta property="og:title" content={social.title}/>,
            <meta property="og:type" content="article"/>,
            <meta property="og:url" content={social.url}/>,
            <meta property="og:image" content={social.imgURL}/>,
            <meta property="og:site_name" content={config.SITE_NAME}/>,
        ];
    },

    renderHeader() {
        const gettext = this.props.gettext;
        const URL = this.props.URL;

        return <div className="navbar navbar-default navbar-static-top">
            <div className="container">
                <div className="navbar-header">
                    <button type="button" className="navbar-toggle"
                        data-toggle="collapse"
                        data-target="#header-navbar"
                    >
                        <span className="sr-only">Toggle Navigation</span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                    <a className="navbar-brand" href={URL("/")}>
                        <img alt={config.SITE_NAME}
                            src={URL("/images/lighthouse.sm.png")}
                            height="40" width="40"
                        />
                        {" "}
                        {config.SITE_NAME_SHORT}
                    </a>
                </div>

                <div id="header-navbar" className="collapse navbar-collapse">
                    <ul className="nav navbar-nav">
                        <li>
                            <a href={URL("/search")}>
                                {gettext("Browse All")}
                            </a>
                        </li>
                        {this.renderLocaleMenu()}
                    </ul>

                    <form action={URL("/search")} method="GET"
                        className={"navbar-form navbar-right search " +
                            "form-inline hidden-xs"}
                    >
                        <div className="form-group">
                            <input name="filter" type="text"
                                className="form-control search-query"
                                placeholder={gettext("Search")}
                            />
                        </div>
                        {" "}
                        <input type="submit" className="btn btn-primary"
                            value={gettext("Search")}
                        />
                    </form>
                </div>
            </div>
        </div>;
    },

    renderLocaleMenu() {
        const URL = this.props.URL;

        return <li className="dropdown">
            <a href="" className="dropdown-toggle"
                data-toggle="dropdown" role="button"
                aria-expanded="false"
            >
                <img alt={locales[this.props.lang]}
                    src={URL(`/images/${this.props.lang}.png`)}
                />
                {" "}
                {locales[this.props.lang]}
                <span className="caret"></span>
            </a>
            <ul className="dropdown-menu" role="menu">
                {Object.keys(locales)
                    .filter((locale) => locale !== this.props.lang)
                    .map((locale) => <li key={locale}>
                        <a href={this.props.getOtherURL(locale)}>
                            <img src={URL(`/images/${locale}.png`)}
                                alt={locales[locale]}
                                width="16" height="11"
                            />
                            {" "}
                            {locales[locale]}
                        </a>
                    </li>)
                }
            </ul>
        </li>;
    },

    renderScripts() {
        const URL = this.props.URL;

        return <div>
            <script src={URL("/js/jquery.min.js")} />
            <script src={URL("/js/bootstrap.min.js")} />
            <script src={URL("/js/app.js")} />
            {this.props.scripts}
        </div>;
    },

    render() {
        return <html lang={this.props.lang}>
            {this.renderHead()}
            <body>
                {this.renderHeader()}
                {this.props.splash}
                <div className="container">
                    {this.props.children}
                </div>
                {this.renderScripts()}
            </body>
        </html>;
    },
});

"use strict";

const React = require("react");

const config = require("../lib/config");

const faviconUrl = "http://pharosartresearch.org/sites/default/files/pharos/files/favicon.ico";
const logoUrl = "http://pharosartresearch.org/sites/default/files/styles/os_files_large/public/pharos/files/pharos_logo.png";

const Page = React.createClass({
    propTypes: {
        URL: React.PropTypes.func.isRequired,
        children: React.PropTypes.any,
        getOtherURL: React.PropTypes.func.isRequired,
        getShortTitle: React.PropTypes.func.isRequired,
        getTitle: React.PropTypes.func.isRequired,
        gettext: React.PropTypes.func.isRequired,
        lang: React.PropTypes.string.isRequired,
        noIndex: React.PropTypes.bool,
        scripts: React.PropTypes.any,
        social: React.PropTypes.shape({
            imgURL: React.PropTypes.string.isRequired,
            url: React.PropTypes.string.isRequired,
            title: React.PropTypes.string.isRequired,
        }),
        splash: React.PropTypes.any,
        style: React.PropTypes.any,
        title: React.PropTypes.string,
    },

    renderHead() {
        const URL = this.props.URL;
        let title = this.props.getTitle(config.siteName);

        if (this.props.title) {
            title = `${this.props.title}: ${title}`;
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
                href={faviconUrl}
            />
            <title>{title}</title>
            {this.props.social && this.renderSocialMeta()}
            <link rel="stylesheet" href={URL("/css/bootstrap.min.css")}/>
            <link rel="stylesheet" href={URL("/css/style.css")}/>
            {this.props.style}
        </head>;
    },

    renderSocialMeta() {
        const social = this.props.social;
        const siteTitle = this.props.getTitle(config.siteName);
        return [
            <meta key="1" name="twitter:card" content="photo"/>,
            <meta key="2" name="twitter:url" content={social.url}/>,
            <meta key="3" name="twitter:title" content={social.title}/>,
            <meta key="4" name="twitter:image" content={social.imgURL}/>,
            <meta key="5" property="og:title" content={social.title}/>,
            <meta key="6" property="og:type" content="article"/>,
            <meta key="7" property="og:url" content={social.url}/>,
            <meta key="8" property="og:image" content={social.imgURL}/>,
            <meta key="9" property="og:site_name" content={siteTitle}/>,
        ];
    },

    renderPharosHeader() {
        return <header role="banner">
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css?family=Montserrat"
            />
            <div className="header-inner-wrap container">
                <a href="http://pharosartresearch.org/">
                    <img
                        height="114"
                        width="421"
                        alt={this.props.getShortTitle(config.siteName)}
                        title={this.props.getShortTitle(config.siteName)}
                        src={logoUrl}
                    />
                </a>

                <a
                    href="http://pharosartresearch.org/contact"
                    className="header-contact-link"
                >
                    {this.props.gettext("Contact")}
                </a>
            </div>
          </header>;
    },

    renderPharosMenu() {
        const gettext = this.props.gettext;

        return <nav className="header-nav">
            <ul className="container">
                <li><a href="http://pharosartresearch.org/">{gettext("Home")}</a></li>
                <li><a href="http://pharosartresearch.org/about">{gettext("About")}</a></li>
                <li><a href="http://pharosartresearch.org/institutions">{gettext("Institutions")}</a></li>
                <li><a href="http://pharosartresearch.org/initiatives">{gettext("Initiatives")}</a></li>
                <li><a href="/" className="active">
                    {gettext("Visual Search")}
                </a></li>
                <li><a href="http://pharosartresearch.org/news">{gettext("News")}</a></li>
            </ul>
        </nav>;
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
                        <img alt={this.props.getTitle(config.siteName)}
                            src={logoUrl}
                            height="40"
                        />
                        {" "}
                        <span className="short-title">
                            {this.props.getShortTitle(config.siteName)}
                        </span>
                    </a>
                </div>

                <div id="header-navbar" className="collapse navbar-collapse">
                    <ul className="nav navbar-nav">
                        <li className="visible-xs">
                            <a href="http://pharosartresearch.org/">
                                {gettext("Home")}
                            </a>
                        </li>
                        <li className="visible-xs">
                            <a href="http://pharosartresearch.org/about">
                                {gettext("About")}
                            </a>
                        </li>
                        <li className="visible-xs">
                            <a href="http://pharosartresearch.org/institutions">
                                {gettext("Institutions")}
                            </a>
                        </li>
                        <li className="visible-xs">
                            <a href="http://pharosartresearch.org/initiatives">
                                {gettext("Initiatives")}
                            </a>
                        </li>
                        <li className="visible-xs active">
                            <a href="/">
                                {gettext("Visual Search")}
                            </a>
                        </li>
                        <li className="visible-xs">
                            <a href="http://pharosartresearch.org/news">
                                {gettext("News")}
                            </a>
                        </li>
                        <li
                            role="separator"
                            className="visible-xs nav-divider"
                        />
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
                <img alt={config.locales[this.props.lang]}
                    src={URL(`/images/${this.props.lang}.png`)}
                    width="16" height="11"
                />
                {" "}
                {config.locales[this.props.lang]}
                <span className="caret"></span>
            </a>
            <ul className="dropdown-menu" role="menu">
                {Object.keys(config.locales)
                    .filter((locale) => locale !== this.props.lang)
                    .map((locale) => <li key={locale}>
                        <a href={this.props.getOtherURL(locale)}>
                            <img src={URL(`/images/${locale}.png`)}
                                alt={config.locales[locale]}
                                width="16" height="11"
                            />
                            {" "}
                            {config.locales[locale]}
                        </a>
                    </li>)
                }
            </ul>
        </li>;
    },

    renderFooter() {
        const curYear = (new Date()).getYear() + 1900;

        return <footer>
            <div className="footer-inner-wrap container">
                <span className="copyright">
                    <a href="http://pharosartresearch.org/">
                        © {curYear} Pharos consortium
                    </a>
                </span>

                <span className="contact">
                    <a href="http://pharosartresearch.org/contact">
                        {this.props.gettext("Contact")}
                    </a>
                </span>
            </div>
        </footer>;
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
                {this.renderPharosHeader()}
                {this.renderPharosMenu()}
                {this.renderHeader()}
                {this.props.splash}
                <div className="container">
                    {this.props.children}
                </div>
                {this.renderFooter()}
                {this.renderScripts()}
            </body>
        </html>;
    },
});

module.exports = Page;

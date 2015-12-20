<!DOCTYPE html>
<html lang="{{ lang }}" dir="{{ lang_dir }}">
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta http-equiv="content-language" content="{{ lang }}"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    {% if noIndex %}
        <meta name="robots" content="noindex"/>
    {% endif %}
    <link rel="icon" href="{{ CDN("/images/favicon.png", {"raw": true}) }}" type="image/x-icon"/>
    <title>{% if title %}
        {{ title }} - {{ SITE_NAME_SHORT }}: {{ SITE_NAME }}
    {% else %}
        {{ SITE_NAME_SHORT }}: {{ SITE_NAME }}
    {% endif %}</title>
    {% if desc %}<meta name="description" content="{{ desc }}"/>{% endif %}

    {% if artwork %}
    <meta name="twitter:card" content="photo">
    <meta name="twitter:url" content="{{ URL(artwork) }}">
    <meta name="twitter:title" content="{{ getTitle(artwork) }}">
    <meta name="twitter:image" content="{{ artwork.getScaledURL() }}">
    <meta property="og:title" content="{{ getTitle(artwork) }}"/>
    <meta property="og:type" content="article"/>
    <meta property="og:url" content="{{ URL(artwork) }}"/>
    <meta property="og:image" content="{{ artwork.getScaledURL() }}"/>
    <meta property="og:site_name" content="{{ SITE_NAME }}"/>
    {% endif %}

    {{ CDN("/css/bootstrap.min.css") }}
    {{ CDN("/css/bootstrap-theme.min.css") }}
    {{ CDN("/css/style.css") }}
</head>
<body>
    <div class="navbar navbar-default navbar-static-top">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#header-navbar">
                    <span class="sr-only">Toggle Navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="{{ URL("/") }}">
                    <img alt="{{ SITE_NAME }}" src="{{ CDN("/images/lighthouse.sm.png", {"raw": true}) }}"
                        height="40" width="40"/>
                    {{ SITE_NAME_SHORT }}
                </a>
            </div>

            <div id="header-navbar" class="collapse navbar-collapse">
                <ul class="nav navbar-nav">
                    <li>
                        <a href="{{ URL("/search") }}">
                            {{ gettext("Browse All") }}
                        </a>
                    </li>
                    <li class="dropdown">
                        <a href="" class="dropdown-toggle"
                            data-toggle="dropdown" role="button"
                            aria-expanded="false">
                            <img src="{{ CDN("/images/" + lang + ".png", {"raw": true}) }}"
                                alt="{{ getLocaleName(lang) }}" />
                            {{ getLocaleName(lang) }}
                            <span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu" role="menu">
                            {% for locale in getLocales() %}
                                {% if locale !== lang %}
                                <li>
                                    <a href="{{ getOtherURL(locale) }}">
                                        <img src="{{ CDN("/images/" + locale + ".png", {"raw": true}) }}"
                                            alt="{{ getLocaleName(locale) }}" />
                                        {{ getLocaleName(locale) }}
                                    </a>
                                </li>
                                {% endif %}
                            {% endfor %}
                        </ul>
                    </li>
                </ul>

                <form action="{{ URL("/search") }}" method="GET"
                    class="navbar-form navbar-right search form-inline hidden-xs">
                    {% if qsLocale() %}
                        <input type="hidden" name="lang" value="{{ lang }}"/>
                    {% endif %}
                    <div class="form-group">
                        <input type="text" class="form-control search-query"
                            placeholder="{{ gettext("Search") }}" id="filter"
                            name="filter" value="{{ query.filter }}" />
                    </div>
                    <input type="submit" class="btn btn-primary"
                        value="{{ gettext("Search") }}" />
                </form>
            </div>
        </div>
    </div>

    {% block splash %}{% endblock %}

    <div class="container">
        {% block content %}{% endblock %}
    </div>

    {{ CDN("/js/jquery.min.js") }}
    {{ CDN("/js/bootstrap.min.js") }}
    {{ CDN("/js/app.js") }}
    {% block script %}{% endblock %}
</body>
</html>
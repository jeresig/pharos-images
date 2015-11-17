<!DOCTYPE html>
<html lang="{{ __("en-US") }}" class="{{ __("en-US") }}">
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta http-equiv="content-language" content="{{ __("en-US") }}"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <link rel="icon" href="{{ CDN("/images/favicon.png", {"raw": true}) }}" type="image/x-icon"/>
    <title>{{ title }} - {{ SITE_NAME }}</title>
    {% if desc %}<meta name="description" content="{{ desc }}"/>{% endif %}

    {% if image %}
    <meta name="twitter:card" content="photo">
    <meta name="twitter:url" content="{{ URL(image) }}">
    <meta name="twitter:title" content="{{ getTitle(image) }}">
    <meta name="twitter:image" content="{{ image.getScaledURL() }}">
    <meta property="og:title" content="{{ getTitle(image) }}"/>
    <meta property="og:type" content="article"/>
    <meta property="og:url" content="{{ URL(image) }}"/>
    <meta property="og:image" content="{{ image.getScaledURL() }}"/>
    <meta property="og:site_name" content="{{ SITE_NAME }}"/>
    {% endif %}

    {{ CDN("/css/bootstrap.min.css") }}
    {{ CDN("/css/bootstrap-theme.min.css") }}
    {{ CDN("/css/select2.min.css") }}
    {{ CDN("/css/ion.rangeSlider.css") }}
    {{ CDN("/css/ion.rangeSlider.skinFlat.css") }}
    {{ CDN("/css/style.css") }}

    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
      <script src="https://oss.maxcdn.com/libs/respond.js/1.3.0/respond.min.js"></script>
    <![endif]-->
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
                <a class="navbar-brand" href="/">{{ SITE_NAME }}</a>
            </div>

            <div id="header-navbar" class="collapse navbar-collapse">
                <ul class="nav navbar-nav">
                    <li{% if getSiteCategory() === "sources" %} class="active"{% endif %}>
                        <a href="{{ URL("/sources") }}">
                            {{ __("Sources") }}</a></li>
                    <li{% if getSiteCategory() === "about" %} class="active"{% endif %}>
                        <a href="{{ URL("/about") }}">
                        {{ __("About") }}</a></li>
                    <li class="nav-divider"></li>
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle"
                            data-toggle="dropdown" role="button"
                            aria-expanded="false">
                            <img src="{{ CDN("/images/" + curLocale() + ".png", {"raw": true}) }}"
                                alt="{{ getLocaleName(curLocale()) }}" />
                            {{ getLocaleName(curLocale()) }}
                            <span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu" role="menu">
                            {% for locale in getLocales() %}
                                {% if locale !== curLocale() %}
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

                <form action="/search" method="GET"
                    class="navbar-form navbar-right search">
                    <input type="text" class="form-control search-query"
                        placeholder="{{ __("Search") }}" id="q"
                        name="q" value="{{ q }}" />
                    <input type="submit" class="btn btn-primary"
                        value="{{ __("Search") }}" />
                </form>
            </div>
        </div>
    </div>

    <div class="container">
        {% block content %}{% endblock %}
    </div>

    {{ CDN("/js/jquery.min.js") }}
    {{ CDN("/js/bootstrap.min.js") }}
    {{ CDN("/js/select2.min.js") }}
    {{ CDN("/js/ion.rangeSlider.min.js") }}
    {{ CDN("/js/app.js") }}
    {% block script %}{% endblock %}
</body>
</html>
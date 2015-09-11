{% extends "../layouts/default.swig" %}

{% block title %}{{ __("Sources of Prints") }}{% endblock %}

{% block content %}

<h2>{{ __("Sources in the Database (<a href='/search'>%s</a> images)", stringNum(total)) }}</h2>

<p>{{ __("These sources of Japanese Woodblock prints have been integrated into the database and are searchable.") }}</p>

<div class="sources">
    {% for sourceType in sourceTypes %}
        {% set rows = activeSources[sourceType.type] %}
        {% if rows %}
            <div class="row">
                <div class="col-md-12">
                    <h4>{{ __(sourceType.name) }}</h4>
                </div>
            </div>
        {% endif %}
        {% for row in rows %}
            <div class="row">
            {% for source in row %}
                <div class="col-md-3">
                <p><a href="{{ source.url }}">{{ fullName(source) }}</a><br/>
                    <small><a href="{{ URL(source) }}"
                        title="{{ fullName(source) }}">
                        {{ __("Browse all %s images...", stringNum(source.numPrints)) }}</a><br/>
                        {{ __(source.location) }}</small></p>
                </div>
            {% endfor %}
            </div>
        {% endfor %}
    {% endfor %}
</div>

<h2>{{ __("Other Sources (est. %s images)", stringNum(totalEstimated)) }}</h2>

<p>{{ __("These are other sources available on the Internet that have not yet been integrated into the database.") }} {{ __("All of these sources are estimated to have at least 100 Japanese woodblock print images online.") }} {{ __("If you know of any other sources please <a href='mailto:jeresig@gmail.com'>contact me</a>.") }}</p>

<div class="sources">
    {% for sourceType in sourceTypes %}
        {% set rows = estimatedSources[sourceType.type] %}
        {% if rows %}
            <div class="row">
                <div class="col-md-12">
                    <h4>{{ __(sourceType.name) }}</h4>
                </div>
            </div>
        {% endif %}
        {% for row in rows %}
            <div class="row">
            {% for source in row %}
                <div class="col-md-3">
                <p><a href="{{ source.url }}">{{ fullName(source) }}</a><br/>
                    <small>{{ __("est. %s print images.", stringNum(source.estNumPrints)) }}</a><br/>
                        {{ __(source.location) }}</small></p>
                </div>
            {% endfor %}
            </div>
        {% endfor %}
    {% endfor %}
</div>

{% endblock %}
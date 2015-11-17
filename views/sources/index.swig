{% extends "../layouts/default.swig" %}

{% block title %}{{ __("Sources of Artworks") }}{% endblock %}

{% block content %}

<h2>{{ __("Sources of Artworks in the Database (<a href='/search'>%s</a> artworks)", stringNum(total)) }}</h2>

<p>...</p>

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
                        {{ __("Browse all %s artworks...", stringNum(source.numArtworks)) }}</a><br/>
                        {{ __(source.location) }}</small></p>
                </div>
            {% endfor %}
            </div>
        {% endfor %}
    {% endfor %}
</div>

{% endblock %}
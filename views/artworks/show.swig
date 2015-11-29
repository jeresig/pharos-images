{% extends "../layouts/default.swig" %}

{% block title %}{{ artwork.title }}{% endblock %}

{% block content %}
<div id="result" class="row">
    <div class="col-md-6 imageholder">
        <div class="row">
            <a href="{{ artwork.getOriginalURL(artwork.images[0]) }}">
                <img src="{{ artwork.getScaledURL(artwork.images[0]) }}"
                    alt="{{ getTitle(artwork) }}"
                    title="{{ getTitle(artwork) }}"/></a>
        </div>
        {% if artwork.images.length > 1 %}
        <div class="row">
        {% for image in artwork.images %}
            <div class="img col-md-3">
                <a class="img" href="{{ artwork.getOriginalURL(image) }}">
                    <img src="{{ artwork.getThumbURL(image) }}"
                        alt="{{ getTitle(artwork) }}"
                        title="{{ getTitle(artwork) }}"/></a>
            </div>
        {% endfor %}
        </div>
        {% endif %}
    </div>
    <div class="details col-md-6">
        <p class="row artist">
            <strong class="col-md-3 right">{{ __("Artist:") }}</strong>
            <span class="col-md-9">
            {% for name in artwork.artists %}
                {% if name.artist %}
                <a href="{{ URL(name.artist) }}"
                    title="{{ fullName(name.artist) }}">
                    {{ fullName(name.artist) }}</a><br/>
                {% else %}
                    <a href="{{ URL('/search?artist=' + encodeURIComponent(name.name)) }}">{{ name.name }}</a><br/>
                {% endif %}
            {% endfor %}
            </span>
        </p>
        {% if artwork.title %}
            <p class="row title">
                <strong class="col-md-3 right">{{ __("Title:") }}</strong>
                <span class="col-md-9">{{ artwork.title }}</span>
            </p>
        {% endif %}
        {% if artwork.dateCreated %}
            <p class="row date">
                <strong class="col-md-3 right">{{ __("Date:") }}</strong>
                <span class="col-md-9">{{ getDate(artwork.dateCreated) }}</span>
            </p>
        {% endif %}
        {% if artwork.dimensions.length > 0 %}
            <p class="row date">
                <strong class="col-md-3 right">{{ __("Dimensions:") }}</strong>
                <span class="col-md-9">
                    {% for dimension in artwork.dimensions %}
                        {{ getDimension(dimension) }}<br/>
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.medium %}
            <p class="row medium">
                <strong class="col-md-3 right">{{ __("Medium:") }}</strong>
                <span class="col-md-9">{{ artwork.medium }}</span>
            </p>
        {% endif %}
        {% if artwork.objectType %}
            <p class="row objectType">
                <strong class="col-md-3 right">{{ __("Type:") }}</strong>
                <span class="col-md-9">{{ artwork.objectType }}</span>
            </p>
        {% endif %}
        {% if artwork.categories.length > 0 %}
            <p class="row categories">
                <strong class="col-md-3 right">{{ __("Categories:") }}</strong>
                <span class="col-md-9">
                    {% for category in artwork.categories %}
                        {{ category }}<br/>
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.collections.length > 0 %}
            <p class="row categories">
                <strong class="col-md-3 right">{{ __("Collection:") }}</strong>
                <span class="col-md-9">
                    {% for collection in artwork.collections %}
                        {{ collection.name }}<br/>
                        {% if collection.city %}
                            {{ collection.city }}<br/>
                        {% endif %}
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.url %}
            <p class="row details">
                <strong class="col-md-3 right">
                    {% if artwork.getSource().commercial %}
                        <small>{{ __("Details &amp;&nbsp;Prices:") }}</small>
                    {% else %}
                        {{ __("Details:") }}
                    {% endif %}
                </strong>
                <span class="col-md-9">
                    {% if artwork.getSource().inactive %}
                        <small>{{ __("Unfortunately the source of this print no longer exists.") }}</small>
                    {% elif artwork.getSource().hideLinks %}
                        <small>{{ __("There is no way to link to this print on the source site. Please visit the source and search for the print there.") }}</small>
                    {% elif artwork.getSource().linkTitle %}
                        <small><a href="{{ artwork.url }}"
                            title="{{ artwork.getSource().linkTitle }}">
                            {{ getTitle(artwork) }}</a></small>
                    {% else %}
                        <a href="{{ artwork.url }}">
                            {{ __("More information...") }}</a>
                    {% endif %}
                </span>
            </p>
        {% endif %}

        {% if artwork.getSource().inactive %}
            <p class="row source">
                <strong class="col-md-3 right">{{ __("Source:") }}</strong>
                <span class="col-md-9"><a href="{{ URL(artwork.getSource()) }}"
                    title="{{ fullName(artwork.getSource()) }}">
                    {{ fullName(artwork.getSource()) }}</a></span>
            </p>
        {% else %}
            <p class="row source">
                <strong class="col-md-3 right">{{ __("Source:") }}</strong>
                <span class="col-md-9"><a href="{{ artwork.getSource().url }}">
                    {% if artwork.getSource().linkText %}
                        {{ artwork.getSource().linkText }}
                    {% else %}
                        {{ fullName(artwork.getSource()) }}
                    {% endif %}
                </a><br/>
                <small><a href="{{ URL(artwork.getSource()) }}"
                    title="{{ fullName(artwork.getSource()) }}">
                    {{ __("Browse all %s prints...", artwork.getSource().count_string) }}</a></small></span>
            </p>
        {% endif %}
    </div>
</div>

<div class="row">
    {% if artwork.similarArtworks.length > 0 %}
    <div class="col-md-12">
        <h2>{{ __("Similar Artworks") }}</h2>
    </div>
    {% endif %}
</div>

<div class="row">

{% if artwork.similarArtworks.length > 0 %}
<div id="results" class="col-md-12">
    <div class="row">
    {% for match in artwork.similarArtworks %}
        {% if match.artwork %}
        <div class="img col-md-3">
            <a class="img" href="{{ URL(match.artwork) }}">
                <img src="{{ match.artwork.getThumbURL(match.artwork.images[0]) }}"
                    alt="{{ getTitle(match.artwork) }}"
                    title="{{ getTitle(match.artwork) }}"/></a>
            <div class="details">
                <div class="wrap">
                {% if match.artwork.dateCreated %}
                    <span class="date">{{ getDate(match.artwork.dateCreated) }}</span>
                {% endif %}
                <a class="source" href="{{ URL(match.artwork.getSource()) }}"
                    title="{{ fullName(match.artwork.getSource()) }}">
                    {{ shortName(match.artwork.getSource()) }}</a>
                </div>
            </div>
        </div>
        {% endif %}
    {% endfor %}
    </div>
</div>
{% endif %}

</div>
{% endblock %}
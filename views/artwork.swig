{% extends "page.swig" %}

{% block title %}{{ artwork.title }}{% endblock %}

{% block content %}
<div id="result" class="row">
    <div class="col-md-6 col-md-offset-2 imageholder">
        <div class="row">
            <div class="col-xs-12">
                <a href="{{ artwork.getOriginalURL(artwork.images[0]) }}">
                    <img src="{{ artwork.getScaledURL(artwork.images[0]) }}"
                        alt="{{ getTitle(artwork) }}"
                        title="{{ getTitle(artwork) }}"
                        class="img-responsive center-block img-thumbnail"/>
                </a>
            </div>
        </div>
        
        {% if artwork.title %}
            <h1 class="title">
                {% if artwork.objectType %}
                    {{ getType(artwork) }}:
                {% endif %}
                {{ artwork.title }}
            </h1>
        {% elif artwork.objectType %}
            <h1 class="title">{{ getType(artwork) }}</h1>
        {% endif %}

        {% if artwork.artists %}
        <p>
            <strong>{{ gettext("Artist:") }}</strong>
            <span>
            {% for name in artwork.artists %}
                {% if name.artist %}
                    <a href="{{ URL(name.artist) }}"
                        title="{{ fullName(name.artist) }}">
                        {{ fullName(name.artist) }}</a>
                {% else %}
                    <a href="{{ searchURL({artist: name.name}) }}">
                        {{ name.name }}
                    </a>
                {% endif %}<br/>
            {% endfor %}
            </span>
        </p>
        {% endif %}

        {% if artwork.dateCreated %}
            <p>
                <strong>{{ gettext("Date:") }}</strong>
                <span>
                    <a href="{{ searchURL({dateStart: artwork.dateCreated.start, dateEnd: artwork.dateCreated.end}) }}">
                        {{ getDate(artwork.dateCreated) }}
                    </a>
                </span>
            </p>
        {% endif %}

        {% if artwork.objectType %}
            <p>
                <a href="{{ searchURL({type: artwork.objectType}) }}">
                    {{ artwork.objectType }}
                </a>
            </p>
        {% endif %}

        {% if artwork.dimensions.length > 0 %}
            <p>
                <strong>{{ gettext("Dimensions:") }}</strong>
                <span>
                    {% for dimension in artwork.dimensions %}
                        {{ getDimension(dimension) }}<br/>
                    {% endfor %}
                </span>
            </p>
        {% endif %}
    </div>
    <div class="col-md-3">
        {% if artwork.images.length > 1 %}
            <div class="row">
                <div class="col-md-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <strong>{{ gettext("Additional Images") }}</strong>
                        </div>
                        <div class="panel-body row">
                            {% for image in artwork.images %}
                                {% if loop.index0 > 0 %}
                                <div class="img col-md-6">
                                    <a href="{{ artwork.getOriginalURL(image) }}">
                                        <img src="{{ artwork.getThumbURL(image) }}"
                                            alt="{{ getTitle(artwork) }}"
                                            title="{{ getTitle(artwork) }}"
                                            class="img-responsive"/>
                                    </a>
                                </div>
                                {% endif %}
                            {% endfor %}
                        </div>
                    </div>
                </div>
            </div>
        {% endif %}

        {% if artwork.similarArtworks.length > 0 %}
        <div class="row">
            <div class="col-md-12">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <strong>{{ gettext("Similar Artworks") }}</strong>
                    </div>
                    <div class="panel-body row">
                        {% for match in artwork.similarArtworks %}
                            {% if match.artwork %}
                            <div class="img col-md-12">
                                <a href="{{ URL(match.artwork) }}">
                                    <img src="{{ match.artwork.getThumbURL(match.artwork.images[0]) }}"
                                        alt="{{ getTitle(match.artwork) }}"
                                        title="{{ getTitle(match.artwork) }}"
                                        class="img-responsive"/>
                                </a>
                                <div class="details">
                                    <div class="wrap">
                                    {% if match.artwork.dateCreated %}
                                        <span>{{ getDate(match.artwork.dateCreated) }}</span>
                                    {% endif %}
                                    <a class="pull-right" href="{{ URL(match.artwork.getSource()) }}"
                                        title="{{ fullName(match.artwork.getSource()) }}">
                                        {{ shortName(match.artwork.getSource()) }}
                                    </a>
                                    </div>
                                </div>
                            </div>
                            {% endif %}
                        {% endfor %}
                    </div>
                </div>
            </div>
        </div>
        {% endif %}
    </div>
    <!--
    <div class="details col-md-6">
        {% if artwork.dimensions.length > 0 %}
            <p class="row date">
                <strong class="col-md-3 text-right">{{ gettext("Dimensions") }}</strong>
                <span class="col-md-9">
                    {% for dimension in artwork.dimensions %}
                        {{ getDimension(dimension) }}<br/>
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.objectType %}
            <p class="row objectType">
                <strong class="col-md-3 text-right">{{ gettext("Type") }}</strong>
                <span class="col-md-9">{{ artwork.objectType }}</span>
            </p>
        {% endif %}
        {% if artwork.medium %}
            <p class="row medium">
                <strong class="col-md-3 text-right">{{ gettext("Medium") }}</strong>
                <span class="col-md-9">{{ artwork.medium }}</span>
            </p>
        {% endif %}
        {% if artwork.categories.length > 0 %}
            <p class="row categories">
                <strong class="col-md-3 text-right">{{ gettext("Categories") }}</strong>
                <span class="col-md-9">
                    {% for category in artwork.categories %}
                        {{ category }}<br/>
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.collections.length > 0 %}
            <p class="row categories">
                <strong class="col-md-3 text-right">{{ gettext("Collection") }}</strong>
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
                <strong class="col-md-3 text-right">
                    {% if artwork.getSource().commercial %}
                        <small>{{ gettext("Details &amp;&nbsp;Prices") }}</small>
                    {% else %}
                        {{ gettext("Details") }}
                    {% endif %}
                </strong>
                <span class="col-md-9">
                    {% if artwork.getSource().inactive %}
                        <small>{{ gettext("Unfortunately the source of this artwork no longer exists.") }}</small>
                    {% elif artwork.getSource().hideLinks %}
                        <small>{{ gettext("There is no way to link to this artwork on the source site. Please visit the source and search for the artwork there.") }}</small>
                    {% elif artwork.getSource().linkTitle %}
                        <small><a href="{{ artwork.url }}"
                            title="{{ artwork.getSource().linkTitle }}">
                            {{ getTitle(artwork) }}</a></small>
                    {% else %}
                        <a href="{{ artwork.url }}">
                            {{ gettext("More information...") }}</a>
                    {% endif %}
                </span>
            </p>
        {% endif %}

        {% if artwork.getSource().inactive %}
            <p class="row source">
                <strong class="col-md-3 text-right">{{ gettext("Source") }}</strong>
                <span class="col-md-9"><a href="{{ URL(artwork.getSource()) }}"
                    title="{{ fullName(artwork.getSource()) }}">
                    {{ fullName(artwork.getSource()) }}</a></span>
            </p>
        {% else %}
            <p class="row source">
                <strong class="col-md-3 text-right">{{ gettext("Source") }}</strong>
                <span class="col-md-9"><a href="{{ artwork.getSource().url }}">
                    {% if artwork.getSource().linkText %}
                        {{ artwork.getSource().linkText }}
                    {% else %}
                        {{ fullName(artwork.getSource()) }}
                    {% endif %}
                </a><br/>
                <small><a href="{{ URL(artwork.getSource()) }}"
                    title="{{ fullName(artwork.getSource()) }}">
                    {{ format(gettext("Browse all %(count)s artworks..."), {count: stringNum(artwork.getSource().numArtworks)}) }}</a></small></span>
            </p>
        {% endif %}
    </div>
    -->
</div>
{% endblock %}
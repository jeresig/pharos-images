{% extends "page.swig" %}

{% block title %}{{ artwork.title }}{% endblock %}

{% block content %}
{% set hasSimilar = artwork.similarArtworks.length > 0 %}
<div id="result" class="row">
    <div class="{% if hasSimilar %}col-md-9{% else %}col-md-12{% endif %} imageholder">
        <div class="panel panel-default">
            <div class="panel-heading">
                {% if artwork.title %}
                    <h1 class="panel-title">
                        {% if artwork.objectType %}
                            {{ getType(artwork) }}:
                        {% endif %}
                        {{ artwork.title }}
                    </h1>
                {% elif artwork.objectType %}
                    <h1 class="panel-title">{{ getType(artwork) }}</h1>
                {% endif %}
            </div>
            <div class="panel-body">
                <div id="openseadragon-viewer"></div>
                <div id="openseadragon-toolbar"></div>
            </div>
        </div>

        <div class="responsive-table">
        <table class="table">

        {% if artwork.artists %}
        <tr>
            <th class="text-right">{{ gettext("Artist") }}</th>
            <td>
            {% for name in artwork.artists %}
                {% if name.artist %}
                    <a href="{{ URL(name.artist) }}"
                        title="{{ fullName(name.artist) }}">
                        {{ fullName(name.artist) }}</a>
                {% else %}
                    <a href="{{ searchURL({artist: name.name}) }}">
                        {{ name.name }}
                    </a>
                    {% if name.pseudonym %}
                        (<a href="{{ searchURL({artist: name.pseudonym}) }}">{{ name.pseudonym }}</a>)
                    {% endif %}
                {% endif %}<br/>
            {% endfor %}
            </td>
        </tr>
        {% endif %}

        {% if artwork.dateCreated %}
            <tr>
                <th class="text-right">{{ gettext("Date") }}</th>
                <td>
                    <a href="{{ searchURL({dateStart: artwork.dateCreated.start, dateEnd: artwork.dateCreated.end}) }}">
                        {{ getDate(artwork.dateCreated) }}
                    </a>
                </td>
            </tr>
        {% endif %}

        {% if artwork.objectType %}
            <tr>
                <th class="text-right">{{ gettext("Type") }}</th>
                <td>
                    <a href="{{ searchURL({type: artwork.objectType}) }}">
                        {{ getType(artwork) }}
                    </a>
                </td>
            </tr>
        {% endif %}

        {% if artwork.medium %}
            <tr>
                <th class="text-right">{{ gettext("Medium") }}</th>
                <td>{{ artwork.medium }}</td>
            </tr>
        {% endif %}

        {% if artwork.dimensions.length > 0 %}
            <tr>
                <th class="text-right">{{ gettext("Dimensions") }}</th>
                <td>
                    {% for dimension in artwork.dimensions %}
                        {{ getDimension(dimension) }}<br/>
                    {% endfor %}
                </td>
            </tr>
        {% endif %}

        {% if artwork.categories.length > 0 %}
            <tr>
                <th class="text-right">{{ gettext("Categories") }}</th>
                <td>{{ artwork.categories|join(", ") }}</td>
            </tr>
        {% endif %}

        {% if artwork.collections.length > 0 && artwork.collections[0].name %}
            <tr>
                <th class="text-right">{{ gettext("Collection") }}</th>
                <td>
                    {% for collection in artwork.collections %}
                        {{ collection.name }}<br/>
                        {% if collection.city %}
                            {{ collection.city }}<br/>
                        {% endif %}
                    {% endfor %}
                </td>
            </tr>
        {% endif %}

        {% if artwork.url %}
            <tr>
                <th class="text-right">
                    {% if artwork.getSource().commercial %}
                        <small>{{ gettext("Details &amp;&nbsp;Prices") }}</small>
                    {% else %}
                        {{ gettext("Details") }}
                    {% endif %}
                </th>
                <td>
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
                </td>
            </tr>
        {% endif %}

        {% if artwork.getSource().inactive %}
            <tr>
                <th class="text-right">{{ gettext("Source") }}</th>
                <td>
                    <a href="{{ URL(artwork.getSource()) }}"
                        title="{{ fullName(artwork.getSource()) }}">
                        {{ fullName(artwork.getSource()) }}
                    </a>
                </td>
            </tr>
        {% else %}
            <tr>
                <th class="text-right">{{ gettext("Source") }}</th>
                <td><a href="{{ artwork.getSource().url }}">
                    {% if artwork.getSource().linkText %}
                        {{ artwork.getSource().linkText }}
                    {% else %}
                        {{ fullName(artwork.getSource()) }}
                    {% endif %}
                </a><br/>
                <small><a href="{{ URL(artwork.getSource()) }}"
                    title="{{ fullName(artwork.getSource()) }}">
                    {{ format(gettext("Browse all %(count)s artworks..."), {count: stringNum(artwork.getSource().numArtworks)}) }}</a></small></td>
            </tr>
        {% endif %}

        </table>
        </div>
    </div>
    {% if hasSimilar %}
    <div class="col-md-3">
        <div class="panel panel-default">
            <div class="panel-heading">
                {{ gettext("Similar Artworks") }}
            </div>
            <div class="panel-body row">
                {% for match in artwork.similarArtworks %}
                    {% if match.artwork %}
                    <div class="img col-md-12 col-xs-6 col-sm-4">
                        <a href="{{ URL(match.artwork) }}">
                            <img src="{{ match.artwork.getThumbURL(match.artwork.images[0]) }}"
                                alt="{{ getTitle(match.artwork) }}"
                                title="{{ getTitle(match.artwork) }}"
                                class="img-responsive center-block"/>
                        </a>
                        <div class="details">
                            <div class="wrap">
                                <span>{{ format(gettext("Score: %(score)s"), {score: match.score}) }}</span>

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
    {% endif %}
</div>
{{ CDN('/js/openseadragon.min.js') }}
<script>
(function() {
    "use strict";
    OpenSeadragon({{ viewerOptions|json|safe }});
})();
</script>
{% endblock %}
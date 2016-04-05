{% extends "page.swig" %}

{% block title %}{{ artwork.title }}{% endblock %}

{% block content %}
<div id="result" class="row">
    <div class="{% if similar.length > 0 %}col-md-9{% else %}col-md-12{% endif %} imageholder">
        {% if compare || artworks.length > 1 %}
            <a href="{{ URL(artworks[0]) }}" class="btn btn-success">
                &laquo; {{ gettext("End Comparison") }}
            </a>
        {% endif %}
        <div class="responsive-table">
        <table class="table table-hover">
        <tr class="plain">
            <th></th>
            {% for artwork in artworks %}
            <th class="col-xs-{{ Math.max(Math.round(12 / artworks.length), 3) }} text-center">
                <h1 class="panel-title">
                {% if artwork.title %}
                    {% if artwork.objectType %}
                        {{ getType(artwork) }}:
                    {% endif %}
                    {{ artwork.title }}
                {% elif artwork.objectType %}
                    {{ getType(artwork) }}
                {% endif %}
                </h1>
            </th>
            {% endfor %}
        </tr>

        <tr class="plain">
            <td></td>
            {% for artwork in artworks %}
            <td>
                {% set carouselId = artwork._id.replace("/", "-") %}
                <div id="{{ carouselId }}" class="carousel" data-interval="0">
                    <div class="carousel-inner" role="listbox">
                    {% for image in artwork.images %}
                        <div class="item{% if loop.first %} active{% endif %}">
                            <a href="{{ image.getOriginalURL() }}">
                                <img src="{{ image.getScaledURL() }}"
                                    alt="{{ getTitle(artwork) }}"
                                    title="{{ getTitle(artwork) }}"
                                    class="img-responsive center-block"/>
                            </a>
                        </div>
                    {% endfor %}
                    </div>

                    {% if artwork.images.length > 1 %}
                    <ol class="carousel-indicators">
                    {% for image in artwork.images %}
                        <li data-target="#{{ carouselId }}" data-slide-to="{{ loop.index0 }}"{% if loop.first %} class="active"{% endif %}></li>
                    {% endfor %}
                    </ol>

                    <a class="left carousel-control" href="#{{ carouselId }}" role="button" data-slide="prev">
                        <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
                        <span class="sr-only">{{ gettext("Previous") }}</span>
                    </a>
                    <a class="right carousel-control" href="#{{ carouselId }}" role="button" data-slide="next">
                        <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
                        <span class="sr-only">{{ gettext("Next") }}</span>
                    </a>
                    {% endif %}
                </div>
            </td>
            {% endfor %}
        </tr>

        {% if compare || artworks[0].artists.length > 0 %}
        <tr>
            <th class="text-right">{{ gettext("Artist") }}</th>
            {% for artwork in artworks %}
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
            {% endfor %}
        </tr>
        {% endif %}

        {% if compare || artworks[0].date %}
            <tr>
                <th class="text-right">{{ gettext("Date") }}</th>
                {% for artwork in artworks %}
                <td>
                    {% if artwork.date %}
                    <a href="{{ searchURL({dateStart: artwork.date.start, dateEnd: artwork.date.end}) }}">
                        {{ getDate(artwork.date) }}
                    </a>
                    {% endif %}
                </td>
                {% endfor %}
            </tr>
        {% endif %}

        {% if compare || artworks[0].objectType %}
            <tr>
                <th class="text-right">{{ gettext("Type") }}</th>
                {% for artwork in artworks %}
                <td>
                    {% if artwork.objectType %}
                    <a href="{{ searchURL({type: artwork.objectType}) }}">
                        {{ getType(artwork) }}
                    </a>
                    {% endif %}
                </td>
                {% endfor %}
            </tr>
        {% endif %}

        {% if compare || artworks[0].medium %}
            <tr>
                <th class="text-right">{{ gettext("Medium") }}</th>
                {% for artwork in artworks %}
                <td>{{ artwork.medium }}</td>
                {% endfor %}
            </tr>
        {% endif %}

        {% if compare || artworks[0].dimensions.length > 0 %}
            <tr>
                <th class="text-right">{{ gettext("Dimensions") }}</th>
                {% for artwork in artworks %}
                <td>
                    {% for dimension in artwork.dimensions %}
                        {{ getDimension(dimension) }}<br/>
                    {% endfor %}
                </td>
                {% endfor %}
            </tr>
        {% endif %}

        {% if compare || artworks[0].categories.length > 0 %}
            <tr>
                <th class="text-right">{{ gettext("Categories") }}</th>
                {% for artwork in artworks %}
                <td>
                    {% for category in artwork.categories %}
                        <a href="{{ searchURL({filter: category}) }}">{{ category }}</a>{% if !loop.last %}, {% endif %}
                    {% endfor %}
                </td>
                {% endfor %}
            </tr>
        {% endif %}

        {% if compare || artworks[0].locations.length > 0 && artworks[0].locations[0].name %}
            <tr>
                <th class="text-right">{{ gettext("Location") }}</th>
                {% for artwork in artworks %}
                <td>
                    {% for location in artwork.locations %}
                        <a href="{{ searchURL({location: location.name}) }}">{{ location.name }}</a><br/>
                        {% if location.city %}
                            {{ location.city }}<br/>
                        {% endif %}
                    {% endfor %}
                </td>
                {% endfor %}
            </tr>
        {% endif %}

        {% if compare || artworks[0].url %}
            <tr>
                <th class="text-right">
                    {{ gettext("Details") }}
                </th>
                {% for artwork in artworks %}
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
                {% endfor %}
            </tr>
        {% endif %}

        <tr>
            <th class="text-right">{{ gettext("Source") }}</th>
            {% for artwork in artworks %}
            {% if artwork.getSource().inactive %}
            <td>
                <a href="{{ URL(artwork.getSource()) }}"
                    title="{{ fullName(artwork.getSource()) }}">
                    {{ fullName(artwork.getSource()) }}
                </a>
            </td>
            {% else %}
            <td>
                <a href="{{ artwork.getSource().url }}">
                    {% if artwork.getSource().linkText %}
                        {{ artwork.getSource().linkText }}
                    {% else %}
                        {{ fullName(artwork.getSource()) }}
                    {% endif %}
                </a><br/>
                <small><a href="{{ URL(artwork.getSource()) }}"
                    title="{{ fullName(artwork.getSource()) }}">
                    {{ format(gettext("Browse all %(count)s artworks..."), {count: stringNum(artwork.getSource().numArtworks)}) }}</a></small>
            </td>
            {% endif %}
            {% endfor %}
        </tr>
        </table>
        </div>
    </div>
    {% if similar.length > 0 %}
    <div class="col-md-3">
        <a href="?compare" class="btn btn-success btn-block" style="margin-bottom: 20px;">
            {{ gettext("Compare Artworks") }} &raquo;
        </a>

        <div class="panel panel-default">
            <div class="panel-heading">
                {{ gettext("Similar Artworks") }}
            </div>
            <div class="panel-body row">
                {% for match in similar %}
                    {% if match.artwork %}
                    <div class="img col-md-12 col-xs-6 col-sm-4">
                        <a href="{{ URL(match.artwork) }}">
                            <img src="{{ match.artwork.getThumbURL() }}"
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
{% endblock %}

{% block script %}
<script>
$(function() {
    $(".carousel").carousel();
});
</script>
{% endblock %}
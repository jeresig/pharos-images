{% extends "../layouts/default.swig" %}

{% block title %}{{ artwork.title }}{% endblock %}

{% block content %}
<div id="result" class="row">
    <div class="col-md-6 imageholder">
        <div class="row">
            <a href="{{ artwork.getOriginalURL(artwork.images[0]) }}">
                <img src="{{ artwork.getScaledURL(artwork.images[0]) }}"
                    alt="{{ getTitle(artwork) }}"
                    title="{{ getTitle(artwork) }}"/>
            </a>
        </div>
        {% if artwork.images.length > 1 %}
            <div class="row">
            {% for image in artwork.images %}
                <div class="img col-md-3">
                    <a href="{{ artwork.getOriginalURL(image) }}">
                        <img src="{{ artwork.getThumbURL(image) }}"
                            alt="{{ getTitle(artwork) }}"
                            title="{{ getTitle(artwork) }}"
                            class="img-responsive"/>
                    </a>
                </div>
            {% endfor %}
            </div>
        {% endif %}
    </div>
    <div id="results" class="col-md-6">
        {% if artwork.similarArtworks.length == 0 %}
            <h3>{{ gettext("Uh oh!") }}</h3>
            <p>{{ gettext("No similar artworks were found.") }}</p>
        {% else %}
            <h3>{{ gettext("Similar Artworks") }}</h3>

            <div class="row">
            {% for match in artwork.similarArtworks %}
                {% if match.artwork %}
                <div class="img col-md-3">
                    <a href="{{ URL(match.artwork) }}">
                        <img src="{{ match.artwork.getThumbURL(match.artwork.images[0]) }}"
                            alt="{{ getTitle(match.artwork) }}"
                            title="{{ getTitle(match.artwork) }}"
                            class="img-responsive"/>
                    </a>
                    <div class="details">
                        <div class="wrap">
                        <span>{{ gettext("Score:") }} {{ match.score }}</span>

                        <a class="source" href="{{ URL(match.artwork.getSource()) }}"
                            title="{{ fullName(match.artwork.getSource()) }}">
                            {{ shortName(match.artwork.getSource()) }}</a>
                        </div>
                    </div>
                </div>
                {% endif %}
            {% endfor %}
            </div>
        {% endif %}
    </div>
</div>
{% endblock %}
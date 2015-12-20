{% extends "page.swig" %}

{% block title %}{{ getTitle(upload) }}{% endblock %}

{% block content %}
<div id="result" class="row">
    <div class="col-md-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <strong>{{ gettext("Uploaded Image") }}</strong>
            </div>
            <div class="panel-body">
                <a href="{{ upload.getOriginalURL() }}">
                    <img src="{{ upload.getScaledURL() }}"
                        alt="{{ getTitle(upload) }}"
                        title="{{ getTitle(upload) }}"
                        class="img-responsive center-block"/>
                </a>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <strong>{{ gettext("Similar Artworks") }}</strong>
            </div>
            <div class="panel-body row">
                {% if upload.similarArtworks.length == 0 %}
                    <div class="col-xs-12">
                        <p>{{ gettext("No similar artworks were found.") }}</p>
                    </div>
                {% else %}
                    {% for match in upload.similarArtworks %}
                    <div class="img col-md-6 col-sm-4 col-xs-6">
                        <a href="{{ URL(match.artwork) }}">
                            <img src="{{ match.artwork.getThumbURL() }}"
                                alt="{{ getTitle(match.artwork) }}"
                                title="{{ getTitle(match.artwork) }}"
                                class="img-responsive center-block"/>
                        </a>
                        <div class="details">
                            <div class="wrap">
                                <span>{{ format(gettext("Score: %(score)s"), {score: match.score}) }}</span>

                                <a class="pull-right"
                                    href="{{ URL(match.artwork.getSource()) }}"
                                    title="{{ fullName(match.artwork.getSource()) }}">
                                    {{ shortName(match.artwork.getSource()) }}
                                </a>
                            </div>
                        </div>
                    </div>
                    {% endfor %}
                {% endif %}
            </div>
        </div>
    </div>
</div>
{% endblock %}
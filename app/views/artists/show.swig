{% extends "../layouts/default.swig" %}

{% block title %}{{ artist.name.name }}{% endblock %}

{% block content %}

<div class="row">
    <div class="col-xs-12 artist_name">
        {{ fullArtistName(artist.name) }}
    </div>
</div>

{% if artist.life.start %}
<div class="row">
    <div class="col-xs-12">
    {% if artist.life.start %}
        {% if artist.life.start_ca %}ca. {% endif %}
        {{artist.life.start}}
    {% endif %}
    &dash;
    {% if artist.life.end %}
        {% if artist.life.end_ca %}ca. {% endif %}
        {{artist.life.end}}
    {% endif %}
    {% if artist.life.current %}
        Alive
    {% endif %}
    </div>
</div>
{% endif %}
{% if artist.active.start %}
<div class="row">
    <div class="col-xs-12">
        <strong>Active:</strong>
        {% if artist.active.start %}
            {% if artist.active.start_ca %}ca. {% endif %}
            {{artist.active.start}}
        {% endif %}
        &dash;
        {% if artist.active.end %}
            {% if artist.active.end_ca %}ca. {% endif %}
            {{artist.active.end}}
        {% endif %}
        {% if artist.active.current %}
            Alive
        {% endif %}
    </div>
</div>
{% endif %}

<p>{{ bio }}</p>

<table>
{% for artist in artists %}
    <tr>
        <td>{{ artist.name.name }}</td>
        <td>{{ artist.name.kanji }}</td>
        <td>{{ artist.life.start }}</td>
        <td>{{ artist.life.end }}</td>
        <td>{{ artist.active.start }}</td>
        <td>{{ artist.active.end }}</td>
    </tr>
    <tr>
        <td colspan="6">
            <ul>
                {% for bio in artist.bios %}
                    <li>{{ bio.name.name }} ({{ bio.source }})</li>
                {% endfor %}
            </ul>
        </td>
    </tr>
{% endfor %}
</table>

{% for image in images %}
<div style="float:left;width:220px;height:240px;">
<a href="{{ URL(image) }}"><img src="{{ image.getThumbURL() }}"/></a>
<span>{% for artist in image.artists %}
    {% if artist.artist %}
        <a href="{{ URL(artist) }}">{{ artist.artist.name.name }}</a>
    {% else %}
        {{ artist.name.name }}
    {% endif %}
{% endfor %}</span>
{% if image.dateCreated %}
<span>{{ getDate(image) }}</span>
{% endif %}
</div>
<!--<p>{{ image.title }} by {% if image.artistNames[0] %}{{ image.artistNames[0].name }}{% endif %}</p>-->
{% endfor %}

{% endblock %}
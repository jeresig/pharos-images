{% extends "../layouts/default.swig" %}

{% block title %}{{ __("Index Page") }}{% endblock %}

{% block content %}

<table>
{% for artist in artists %}
    <tr>
        <td><a href="/artists/{{ artist.id }}">{{ artist.name.name }}</a></td>
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

{% endblock %}
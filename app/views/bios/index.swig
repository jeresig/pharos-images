{% extends "../layouts/default.swig" %}

{% block title %}{{ __("Index Page") }}{% endblock %}

{% block content %}

{% for bio in bios %}
    <p>{{ bio.name.name }}</p>
{% endfor %}

{% endblock %}
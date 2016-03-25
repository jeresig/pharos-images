{% extends "page.swig" %}

{% block title %}{{ title }}{% endblock %}

{% block content %}
    <h1>{{ title }}</h1>
    {% if body %}
    <pre>
        {{ body }}
    </pre>
    {% endif %}
{% endblock %}
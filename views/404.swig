{% extends "page.swig" %}

{% block title %}{{ title || gettext("Not found") }}{% endblock %}

{% block content %}
    <h1>{{ title || gettext("Not found") }}</h1>
{% endblock %}
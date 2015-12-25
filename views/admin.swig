{% extends "page.swig" %}

{% block title %}{{ fullName(source) }}{% endblock %}

{% block content %}
<h1>{{ fullName(source) }}</h1>

<ul>
    <li>
        <a href="{{ searchURL({source: source._id}) }}">
            {{ gettext("Browse Artworks") }}
        </a>
    </li>
    <li>
        <a href="{{ searchURL({source: source._id, hasLink: true}) }}">
            {{ gettext("Links to Another Artwork") }}
        </a>
    </li>
    <li>
        <a href="{{ searchURL({source: source._id, hasExternalLink: true}) }}">
            {{ gettext("Links to an External Artwork") }}
        </a>
    </li>
    <li>
        <a href="{{ searchURL({source: source._id, hasInternalLink: true}) }}">
            {{ gettext("Links to an Internal Artwork") }}
        </a>
    </li>
</ul>
{% endblock %}

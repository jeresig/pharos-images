{% extends "page.swig" %}

{% block title %}{{ format(gettext("Data Import: %(fileName)s"), {fileName: batch.fileName}) }}{% endblock %}

{% block content %}
<h1>{{ format(gettext("Data Import: %(fileName)s"), {fileName: batch.fileName}) }}</h1>

<p>{{ format(gettext("Uploaded: %(date)s"), {date: fixedDate(batch.created)}) }}</p>

{% if batch.state !== "completed" %}
<p>{{ batchState(batch) }} {{ format(gettext("Last Updated: %(date)s"), {date: relativeDate(batch.modified)}) }}</p>
{% endif %}

<p>
{% if batch.state === "process.completed" %}
    <a href="{{ URL(batch) }}" class="btn btn-success">
        {{ gettext("Finalize Import") }}
    </a>

    <a href="{{ URL(batch) }}" class="btn btn-danger">
        {{ gettext("Abandon Import") }}
    </a>
{% else %}
    {{ batchState(batch) }}
{% endif %}
</p>

{% if results.created.length > 0 %}
<h2>{{ gettext("Created") }} ({{ results.created.length }})</h2>

{% for result in results.created %}
    {% if expanded === "created" || loop.index0 < 5 %}
    {{ result.model }}
    <pre>{{ result.data|json(4) }}</pre>
    {% endif %}
{% endfor %}

{% if results.created.length > 5 %}
    <a href="?expanded=created">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.created.length)}) }}</a>
{% endif %}
{% endif %}

{% endblock %}
{% extends "page.swig" %}

{% block title %}{{ format(gettext("Data Import: %(fileName)s"), {fileName: batch.fileName}) }}{% endblock %}

{% block script %}
{{ CDN("/css/format-diff.css") }}
{% endblock %}

{% block content %}
<h1>{{ format(gettext("Data Import: %(fileName)s"), {fileName: batch.fileName}) }}</h1>

<p>{{ format(gettext("Uploaded: %(date)s"), {date: fixedDate(batch.created)}) }}</p>

{% if batch.state !== "completed" %}
<p>{{ batchState }} {{ format(gettext("Last Updated: %(date)s"), {date: relativeDate(batch.modified)}) }}</p>
{% endif %}

{% if batch.state === "process.completed" %}
<p>
    <a href="{{ URL(batch, {finalize: true}) }}" class="btn btn-success">
        {{ gettext("Finalize Import") }}
    </a>

    <a href="{{ URL(batch, {abandon: true}) }}" class="btn btn-danger">
        {{ gettext("Abandon Import") }}
    </a>
</p>
{% endif %}

{% if results.unprocessed.length > 0 %}
<h2 id="unprocessed">{{ gettext("To Be Processed") }} ({{ stringNum(results.unprocessed.length) }})</h2>

{% for result in results.unprocessed %}
    {% if expanded === "unprocessed" || loop.index0 < 5 %}
    <pre>{{ result.data|json(4) }}</pre>
    {% endif %}
{% endfor %}

{% if results.unprocessed.length > 5 %}
    <a href="{{ URL(batch, {expanded: "unprocessed"}) }}#unprocessed">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.unprocessed.length)}) }}</a>
{% endif %}
{% endif %}

{% if results.changed.length > 0 %}
<h2 id="changed">{% if batch.state === "completed" %}{{ gettext("Changed") }}{% else %}{{ gettext("To Be Changed") }}{% endif %} ({{ stringNum(results.changed.length) }})</h2>

{% for result in results.changed %}
    {% if expanded === "changed" || loop.index0 < 5 %}
    <h3><a href="{{ urlFromID(result.model) }}">{{ result.model }}</a></h3>
    <div class="diff">{{ diff(result.diff) }}</div>
    {% endif %}
{% endfor %}

{% if results.changed.length > 5 %}
    <a href="{{ URL(batch, {expanded: "changed"}) }}#changed">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.changed.length)}) }}</a>
{% endif %}
{% endif %}

{% if results.created.length > 0 %}
<h2 id="completed">{% if batch.state === "completed" %}{{ gettext("Created") }}{% else %}{{ gettext("To Be Created") }}{% endif %} ({{ stringNum(results.created.length) }})</h2>

{% for result in results.created %}
    {% if expanded === "created" || loop.index0 < 5 %}
    <h3>
    {% if batch.state === "completed" %}
        <a href="{{ urlFromID(result.model) }}">{{ result.model }}</a>
    {% else %}
        {{ result.model }}
    {% endif %}
    </h3>
    <pre>{{ result.data|json(4) }}</pre>
    {% endif %}
{% endfor %}

{% if results.created.length > 5 %}
    <a href="{{ URL(batch, {expanded: "created"}) }}#completed">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.created.length)}) }}</a>
{% endif %}
{% endif %}

{% if results.deleted.length > 0 %}
<h2 id="deleted">{% if batch.state === "completed" %}{{ gettext("Deleted") }}{% else %}{{ gettext("To Be Deleted") }}{% endif %} ({{ stringNum(results.deleted.length) }})</h2>

<ul>
{% for result in results.deleted %}
    {% if expanded === "deleted" || loop.index0 < 5 %}
    <li>
    {% if batch.state !== "completed" %}
        <a href="{{ urlFromID(result.model) }}">{{ result.model }}</a>
    {% else %}
        {{ result.model }}
    {% endif %}
    </li>
    {% endif %}
{% endfor %}
</ul>

{% if results.deleted.length > 5 %}
    <a href="{{ URL(batch, {expanded: "deleted"}) }}#deleted">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.deleted.length)}) }}</a>
{% endif %}
{% endif %}

{% endblock %}
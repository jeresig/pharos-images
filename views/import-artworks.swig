{% extends "page.swig" %}

{% block title %}{{ format(gettext("Data Import: %(fileName)s"), {fileName: batch.fileName}) }}{% endblock %}

{% block script %}
{{ CDN("/css/format-diff.css") }}
<style>
pre {
    max-height: 200px;
    overflow: auto;
}
</style>
{% endblock %}

{% block content %}
<p><a href="{{ adminURL }}" class="btn btn-primary">&laquo; {{ gettext("Return to Admin Page") }}</a></p>

<h1>{{ format(gettext("Data Import: %(fileName)s"), {fileName: batch.fileName}) }}</h1>

<p>{{ format(gettext("Uploaded: %(date)s"), {date: fixedDate(batch.created)}) }}</p>

<p><strong>{% if batch.state === "error" %}
    {{ format(gettext("Error: %(error)s"), {error: batchError(batch.error)}) }}
{% else %}
    {{ batchState(batch) }}
{% endif %}</strong></p>

{% if batch.state !== "completed" %}
<p>{{ format(gettext("Last Updated: %(date)s"), {date: relativeDate(batch.modified)}) }}</p>
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
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="unprocessed" class="panel-title">{{ gettext("To Be Processed") }} ({{ stringNum(results.unprocessed.length) }})</h3>
    </div>
    <div class="panel-body">
        {% for result in results.unprocessed %}
            {% if expanded === "unprocessed" || loop.index0 < 5 %}
            <pre>{{ result.data|json(4) }}</pre>
            {% endif %}
        {% endfor %}

        {% if results.unprocessed.length > 5 %}
            <a href="{{ URL(batch, {expanded: "unprocessed"}) }}#unprocessed">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.unprocessed.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% if results.errors.length > 0 %}
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="completed" class="panel-title">{{ gettext("Errors") }} ({{ stringNum(results.errors.length) }})</h3>
    </div>
    <div class="panel-body">
        {% for result in results.errors %}
            {% if expanded === "errors" || loop.index0 < 5 %}
            <h4>{{ result.error }}</h4>
            <pre>{{ result.data|json(4) }}</pre>
            {% endif %}
        {% endfor %}

        {% if results.errors.length > 5 && expanded !== "errors" %}
            <a href="{{ URL(batch, {expanded: "errors"}) }}#errors">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.errors.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% if results.warnings.length > 0 %}
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="warnings" class="panel-title">{{ gettext("Warnings") }} ({{ stringNum(results.warnings.length) }})</h3>
    </div>
    <div class="panel-body">
        {% for result in results.warnings %}
            {% if expanded === "warnings" || loop.index0 < 5 %}
            <h4>{{ result.data.id }}</h4>
            <ul>
            {% for warning in result.warnings %}
                <li>{{ batchError(warning) }}</li>
            {% endfor %}
            </ul>
            <pre>{{ result.data|json(4) }}</pre>
            {% endif %}
        {% endfor %}

        {% if results.warnings.length > 5 && expanded !== "warnings" %}
            <a href="{{ URL(batch, {expanded: "warnings"}) }}#warnings">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.warnings.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% if results.changed.length > 0 %}
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="changed" class="panel-title">{% if batch.state === "completed" %}{{ gettext("Changed") }}{% else %}{{ gettext("To Be Changed") }}{% endif %} ({{ stringNum(results.changed.length) }})</h3>
    </div>
    <div class="panel-body">
        {% for result in results.changed %}
            {% if expanded === "changed" || loop.index0 < 5 %}
            <h4><a href="{{ urlFromID(result.model) }}">{{ result.model }}</a></h4>
            <div class="diff">{{ diff(result.diff) }}</div>
            {% endif %}
        {% endfor %}

        {% if results.changed.length > 5 && expanded !== "changed" %}
            <a href="{{ URL(batch, {expanded: "changed"}) }}#changed">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.changed.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% if results.created.length > 0 %}
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="completed" class="panel-title">{% if batch.state === "completed" %}{{ gettext("Created") }}{% else %}{{ gettext("To Be Created") }}{% endif %} ({{ stringNum(results.created.length) }})</h3>
    </div>
    <div class="panel-body">
        {% for result in results.created %}
            {% if expanded === "created" || loop.index0 < 5 %}
            <h4>
            {% if batch.state === "completed" %}
                <a href="{{ urlFromID(result.model) }}">{{ result.model }}</a>
            {% else %}
                {{ result.model }}
            {% endif %}
            </h4>
            <pre>{{ result.data|json(4) }}</pre>
            {% endif %}
        {% endfor %}

        {% if results.created.length > 5 && expanded !== "created" %}
            <a href="{{ URL(batch, {expanded: "created"}) }}#completed">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.created.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% if results.deleted.length > 0 %}
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="deleted" class="panel-title">{% if batch.state === "completed" %}{{ gettext("Deleted") }}{% else %}{{ gettext("To Be Deleted") }}{% endif %} ({{ stringNum(results.deleted.length) }})</h3>
    </div>
    <div class="panel-body">
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

        {% if results.deleted.length > 5 && expanded !== "deleted" %}
            <a href="{{ URL(batch, {expanded: "deleted"}) }}#deleted">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.deleted.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% endblock %}
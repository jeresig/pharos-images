{% extends "page.swig" %}

{% block title %}{{ format(gettext("Image Import: %(fileName)s"), {fileName: batch.fileName}) }}{% endblock %}

{% block content %}
<p><a href="{{ adminURL }}" class="btn btn-primary">&laquo; {{ gettext("Return to Admin Page") }}</a></p>

<h1>{{ format(gettext("Image Import: %(fileName)s"), {fileName: batch.fileName}) }}</h1>

<p>{{ format(gettext("Uploaded: %(date)s"), {date: fixedDate(batch.created)}) }}</p>

<p><strong>{% if batch.state === "error" %}
    {{ format(gettext("Error: %(error)s"), {error: batchError(batch.error)}) }}
{% else %}
    {{ batchState(batch) }}
{% endif %}</strong></p>

{% if batch.state !== "completed" && batch.state !== "error" %}
<p>{{ format(gettext("Last Updated: %(date)s"), {date: relativeDate(batch.modified)}) }}</p>
{% endif %}

{% if results.errors.length > 0 %}
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="errors" class="panel-title">{{ gettext("Errors") }} ({{ stringNum(results.errors.length) }})</h3>
    </div>
    <div class="panel-body">
        <ul>
        {% for result in results.errors %}
            {% if expanded === "errors" || loop.index0 < 5 %}
            <li>{{ result.fileName }}: {{ batchError(result.error) }}</li>
            {% endif %}
        {% endfor %}
        </ul>

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
        <ul>
        {% for result in results.warnings %}
            {% if expanded === "warnings" || loop.index0 < 5 %}
            <li>{{ result.fileName }}:
                <ul>
                {% for warning in result.warnings %}
                    <li>{{ batchError(warning) }}</li>
                {% endfor %}
                </ul>
            </li>
            {% endif %}
        {% endfor %}
        </ul>

        {% if results.warnings.length > 5 && expanded !== "warnings" %}
            <a href="{{ URL(batch, {expanded: "warnings"}) }}#warnings">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.warnings.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% if results.models.length > 0 %}
<div class="panel panel-default">
    <div class="panel-heading">
        <h3 id="images" class="panel-title">{{ gettext("Images") }} ({{ stringNum(results.models.length) }})</h3>
    </div>
    <div class="panel-body">
        <div class="row">
        {% for result in results.models %}
            {% if expanded === "images" || loop.index0 < 8 %}
            <div class="img col-xs-6 col-sm-4 col-md-3">
                <div class="img-wrap">
                    <a href="{{ result.model.getOriginalURL() }}">
                        <img src="{{ result.model.getThumbURL() }}"
                            class="img-responsive center-block"/>
                    </a>
                </div>
                <div class="details">
                    <div class="wrap">
                        {{ result.fileName }}
                    </div>
                </div>
            </div>
            {% endif %}
        {% endfor %}
        </div>

        {% if results.models.length > 8 && expanded !== "images" %}
            <a href="{{ URL(batch, {expanded: "images"}) }}#images">{{ format(gettext("Show all %(count)s results..."), {count: stringNum(results.models.length)}) }}</a>
        {% endif %}
    </div>
</div>
{% endif %}

{% endblock %}
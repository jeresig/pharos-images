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

<h2>Upload Images</h2>

<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">{{ gettext("Upload a Zip File of Images") }}</h3>
    </div>
    <div class="panel-body">
        <form action="/sources/{{source._id}}/upload-batch" method="POST" enctype="multipart/form-data">
            {% if qsLocale() %}
                <input type="hidden" name="lang" value="{{ lang }}"/>
            {% endif %}
            <div class="form-inline">
                <div class="form-group">
                    <input type="file" id="file" name="file" class="form-control" />
                </div>
                <input type="submit" value="{{ gettext("Upload Zip File") }}" class="btn btn-primary" />
            </div>
        </form>
    </div>
</div>

{% if batches.length > 0 %}
<div class="responsive-table">
<table class="table">
    <tr>
        <th>{{ gettext("Zip File Name") }}</th>
        <th>{{ gettext("Last Updated") }}</th>
        <th>{{ gettext("Status") }}</th>
        <th>{{ gettext("Images") }}</th>
        <th>{{ gettext("Errors") }}</th>
        <th>{{ gettext("Warnings") }}</th>
    </tr>
    {% for batch in batches %}
    <tr>
        <td>{{ batch.fileName }}</td>
        <td>{{ batch.modified }}</td>
        {% if batch.state === "error" %}
        <td colspan="4">
            {{ format(gettext("Error: %(error)s"), {error: batch.error}) }}
        </td>
        {% else %}
        {% set results = batch.getFilteredResults() %}
        <td>{{ batch.state }}</td>
        <td>{{ results.images.length }}</td>
        <td>{{ results.errors.length }}</td>
        <td>{{ results.warnings.length }}</td>
        {% endif %}
    </tr>
    {% endfor %}
</table>
</div>
{% endif %}
{% endblock %}

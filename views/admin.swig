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

<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">{{ gettext("Upload Images") }}</h3>
    </div>
    <div class="panel-body">
        <form action="/source/{{source._id}}/upload-images" method="POST" enctype="multipart/form-data">
            {% if qsLocale() %}
                <input type="hidden" name="lang" value="{{ lang }}"/>
            {% endif %}

            <p>
                {{ gettext("Upload a Zip file (.zip) of JPG images (.jpg or .jpeg).") }}
                {{ gettext("Names of images should match the names provided in the artwork metadata.") }}
                {{ gettext("After you've uploaded a new batch of images they will be processed immediately but their similarlity to other images will be computed in the background over the subsequent hours and days.") }}
            </p>

            <div class="form-inline">
                <div class="form-group">
                    <input type="file" name="zipField" class="form-control" />
                </div>
                <input type="submit" value="{{ gettext("Upload") }}" class="btn btn-primary" />
            </div>
        </form>
    </div>
</div>

{% if imageImport.length > 0 %}
<div class="responsive-table">
<table class="table">
    <tr>
        <th>{{ gettext("File Name") }}</th>
        <th>{{ gettext("Last Updated") }}</th>
        <th>{{ gettext("Status") }}</th>
        <th>{{ gettext("Images") }}</th>
        <th>{{ gettext("Errors") }}</th>
        <th>{{ gettext("Warnings") }}</th>
    </tr>
    {% for batch in imageImport %}
    <tr>
        <td><a href="{{ URL(batch) }}">{{ batch.fileName }}</a></td>
        <td>{{ relativeDate(batch.modified) }}</td>
        {% if batch.state === "error" %}
        <td colspan="4">
            {{ format(gettext("Error: %(error)s"), {error: batchError(batch)}) }}
        </td>
        {% else %}
        {% set results = batch.getFilteredResults() %}
        <td>{{ batchState(batch) }}</td>
        <td>{{ results.models.length }}</td>
        <td>{{ results.errors.length }}</td>
        <td>{{ results.warnings.length }}</td>
        {% endif %}
    </tr>
    {% endfor %}
</table>
</div>
{% endif %}

<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">{{ gettext("Upload Artwork Metadata") }}</h3>
    </div>
    <div class="panel-body">
        {% if imagesImported %}
        <form action="/source/{{source._id}}/upload-data" method="POST" enctype="multipart/form-data">
            {% if qsLocale() %}
                <input type="hidden" name="lang" value="{{ lang }}"/>
            {% endif %}

            {% for file in source.getExpectedFiles() %}
                <p>{{ file }}</p>

                <div class="form-inline">
                    <div class="form-group">
                        <input type="file" name="files" class="form-control" />
                    </div>
                    {% if loop.last %}
                    <input type="submit" value="{{ gettext("Upload") }}" class="btn btn-primary" />
                    {% endif %}
                </div>
            {% endfor %}
        </form>
        {% else %}
        <p>{{ gettext("You must upload some images before you can upload any artwork metadata.") }}</p>
        {% endif %}
    </div>
</div>

{% if artworkImport.length > 0 %}
<div class="responsive-table">
<table class="table">
    <tr>
        <th>{{ gettext("File Name") }}</th>
        <th>{{ gettext("Last Updated") }}</th>
        <th>{{ gettext("Status") }}</th>
        <th>{{ gettext("Unprocessed") }}</th>
        <th>{{ gettext("Created") }}</th>
        <th>{{ gettext("Updated") }}</th>
        <th>{{ gettext("Deleted") }}</th>
        <th>{{ gettext("Errors") }}</th>
        <th>{{ gettext("Warnings") }}</th>
    </tr>
    {% for batch in artworkImport %}
    <tr>
        <td>
            <a href="{{ URL(batch) }}">{{ batch.fileName }}</a>
        </td>
        <td>{{ relativeDate(batch.modified) }}</td>
        {% if batch.state === "error" %}
        <td colspan="7">
            {{ format(gettext("Error: %(error)s"), {error: batchError(batch)}) }}
        </td>
        {% else %}
        {% set results = batch.getFilteredResults() %}
        <td>
            {% if batch.state === "process.completed" %}
                <a href="{{ URL(batch) }}" class="btn btn-success btn-xs">
                    {{ gettext("Finalize Import") }}
                </a>
            {% else %}
                {{ batchState(batch) }}
            {% endif %}
        </td>
        <td>{{ results.unprocessed.length }}</td>
        <td>{{ results.created.length }}</td>
        <td>{{ results.changed.length }}</td>
        <td>{{ results.deleted.length }}</td>
        <td>{{ results.errors.length }}</td>
        <td>{{ results.warnings.length }}</td>
        {% endif %}
    </tr>
    {% endfor %}
</table>
</div>
{% endif %}
{% endblock %}
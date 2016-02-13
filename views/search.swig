{% extends "page.swig" %}

{% block content %}

<div class="row">
    <div class="col-xs-12">
        <h1>{{ title }}</h1>
        {% if url %}
            <p><a href="{{ url }}">{{ url }}</a></p>
        {% endif %}
    </div>
</div>

<div class="row results-wrap">
    <div class="results-side col-sm-3 col-sm-push-9">
        <div class="panel panel-default facet">
            <div class="panel-heading">
                <strong>{{ format(gettext("%(numArtworks)s matches."), {numArtworks: stringNum(total)})|raw }}</strong>

                {% if end %}
                    <span>{{ format(gettext("Viewing %(start)s to %(end)s."), {start: stringNum(start), end: stringNum(end)}) }}</span>
                {% endif %}
            </div>
            <div class="panel-body search-form">
            <form action="/search" method="GET">
                {% if qsLocale() %}
                    <input type="hidden" name="lang" value="{{ lang }}"/>
                {% endif %}
                <div class="form-group">
                    <label for="filter" class="control-label">{{ gettext("Query") }}</label>
                    <input type="search" name="filter"
                        placeholder="{{ gettext("Sample: christ or cristo") }}"
                        value="{{query.filter}}" class="form-control"/>
                </div>
                <div class="form-group">
                    <label for="artist" class="control-label">{{ gettext("Artist") }}</label>
                    <input type="text" name="artist"
                        placeholder="{{ gettext("Sample: Andrea del Sarto") }}"
                        value="{{query.artist}}" class="form-control"/>
                </div>
                <div class="form-group">
                    <label for="location" class="control-label">{{ gettext("Location") }}</label>
                    <input type="text" name="location"
                        placeholder="{{ gettext("Sample: Louvre") }}"
                        value="{{query.location}}" class="form-control"/>
                </div>
                <div class="form-group">
                    <label for="type" class="control-label">{{ gettext("Type") }}</label>
                    <select name="type" style="width: 100%;" class="form-control">
                        <option value="" selected>{{ gettext("Any Type") }}</option>
                    {% for type in types %}
                        <option value="{{type.id}}" {% if type.selected %} selected{% endif %}>{{type.name}}</option>
                    {% endfor %}
                    </select>
                </div>
                <div class="form-group">
                    <label for="dateStart" class="control-label">{{ gettext("Date") }}</label>
                    <div class="form-inline">
                        <input type="text" name="dateStart" value="{{query.dateStart}}"
                            placeholder="{{minDate}}" class="form-control date-control"/>
                        &mdash;
                        <input type="text" name="dateEnd" value="{{query.dateEnd}}"
                            placeholder="{{maxDate}}" class="form-control date-control"/>
                    </div>
                </div>
                <div class="row">
                    <div class="form-group col-xs-6 col-sm-12 col-lg-6">
                        <label for="widthMin" class="control-label">{{ format(gettext("Width (%(unit)s)"), {unit: getUnit()}) }}</label>
                        <div class="form-inline">
                            <input type="text" name="widthMin" value="{{query.widthMin}}"
                                placeholder="10" class="form-control size-control"/>
                            &mdash;
                            <input type="text" name="widthMax" value="{{query.widthMax}}"
                                placeholder="200" class="form-control size-control"/>
                        </div>
                    </div>
                    <div class="form-group col-xs-6 col-sm-12 col-lg-6">
                        <label for="heightMin" class="control-label">{{ format(gettext("Height (%(unit)s)"), {unit: getUnit()}) }}</label>
                        <div class="form-inline">
                            <input type="text" name="heightMin" value="{{query.heightMin}}"
                                placeholder="10" class="form-control size-control"/>
                            &mdash;
                            <input type="text" name="heightMax" value="{{query.heightMax}}"
                                placeholder="200" class="form-control size-control"/>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="source" class="control-label">{{ gettext("Source") }}</label>
                    <select name="source" style="width: 100%;" class="form-control">
                        <option value="" selected>{{ gettext("Any Source") }}</option>
                    {% for source in sources %}
                        <option value="{{source._id}}" {% if query.source === source._id %} selected{% endif %}>{{source.name}}</option>
                    {% endfor %}
                    </select>
                </div>
                <div class="form-group">
                    <label for="source" class="control-label">{{ gettext("Sort") }}</label>
                    <select name="sort" style="width: 100%;" class="form-control">
                    {% for sort in sorts %}
                        <option value="{{sort.id}}" {% if sort.selected %} selected{% endif %}>{{sort.name}}</option>
                    {% endfor %}
                    </select>
                </div>
                <div class="form-group">
                    <input type="submit" value="{{ gettext("Search") }}"
                        class="btn btn-primary"/>
                </div>
            </form>
            </div>
        </div>

        <div class="hidden-xs hidden-sm">
        {% for facet in facets %}
            <div class="panel panel-default facet">
                <div class="panel-heading">{{ facet.name }}</div>
                <div class="panel-body">
                    <ul>
                        {% for bucket in facet.buckets %}
                            <li><a href="{{ bucket.url }}">
                                {{ bucket.text }}</a> ({{bucket.count}})</li>
                        {% endfor %}
                    </ul>

                    {% if facet.extra %}
                        <button class="btn btn-default btn-xs toggle-facets">
                            {{ format(gettext("Show %(count)s more..."), {count: facet.extra.length}) }}
                        </button>

                        <div class="extra-facets">
                        <ul>
                            {% for bucket in facet.extra %}
                                <li><a href="{{ bucket.url }}">
                                    {{ bucket.text }}</a>
                                    ({{bucket.count}})</li>
                            {% endfor %}
                        </ul>
                        </div>
                    {% endif %}
                </div>
            </div>
        {% endfor %}
        </div>
    </div>

    <div class="results-main col-sm-9 col-sm-pull-3">
        {% if breadcrumbs.length > 0 %}
            <div class="row">
                <div class="col-xs-12">
                    <div class="btn-group" role="group">
                    {% for crumb in breadcrumbs %}
                        <a href="{{ crumb.url }}"
                            class="btn btn-default btn-xs"
                            title="{{ format(gettext("Remove %(query)s"), {query: crumb.name}) }}">
                            <span class="glyphicon glyphicon-remove-sign" style="vertical-align: -1px;" aria-hidden="true"></span>
                            <span aria-hidden="true">{{ crumb.name }}</span>
                            <span class="sr-only">
                                {{ format(gettext("Remove %(query)s"), {query: crumb.name}) }}
                            </span>
                        </a>
                    {% endfor %}
                    </div>
                </div>
            </div>
        {% endif %}

        <nav>
            <ul class="pager">
                {% if prev %}
                    <li class="previous">
                        <a href="{{ prev }}">
                            <span aria-hidden="true">&larr;</span>
                            {{ gettext("Previous") }}
                        </a>
                    </li>
                {% endif %}
                {% if next %}
                    <li class="next">
                        <a href="{{ next }}">
                            {{ gettext("Next") }}
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                    </li>
                {% endif %}
            </ul>
        </nav>

        <div class="row">
        {% for artwork in artworks %}
            <div class="img col-xs-6 col-sm-4 col-md-3">
                <a href="{{ URL(artwork) }}"
                    title="{{ getTitle(artwork) }}">
                    <img src="{{ artwork.getThumbURL() }}"
                        alt="{{ getTitle(artwork) }}"
                        title="{{ getTitle(artwork) }}"
                        class="img-responsive"/>
                </a>
                <div class="details">
                    <div class="wrap">
                        {% if artwork.date %}
                            <span>{{ getDate(artwork.date) }}</span>
                        {% endif %}

                        {% if artwork.artist %}
                            {% if artwork.artist.artist %}
                                <a href="{{ URL(artwork.artist.artist) }}"
                                    title="{{ fullName(artwork.artist.artist) }}">
                                    {{ shortName(artwork.artist.artist) }}</a>
                            {% endif %}
                        {% endif %}

                        <a class="pull-right"
                            href="{{ URL(artwork.getSource()) }}"
                            title="{{ fullName(artwork.getSource()) }}">
                            {{ shortName(artwork.getSource()) }}</a>
                    </div>
                </div>
            </div>
        {% endfor %}
        </div>

        <nav>
            <ul class="pager">
                {% if prev %}
                    <li class="previous">
                        <a href="{{ prev }}">
                            <span aria-hidden="true">&larr;</span> {{ gettext("Previous") }}
                        </a>
                    </li>
                {% endif %}
                {% if next %}
                    <li class="next">
                        <a href="{{ next }}">
                            {{ gettext("Next") }} <span aria-hidden="true">&rarr;</span>
                        </a>
                    </li>
                {% endif %}
            </ul>
        </nav>
    </div>
</div>

{% endblock %}
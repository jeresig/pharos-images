{% extends "../layouts/default.swig" %}

{% block content %}

<div class="row">
    <h1 class="col-md-12">{{ title }}</h1>
    {% if url %}
        <p class="col-md-12"><a href="{{ url }}">{{ url }}</a></p>
    {% endif %}
</div>

<div class="row results-wrap">
    <div class="results-side col-sm-3 col-sm-push-9">
        <form action="/search" method="GET">
            {% if qsLocale() %}
                <input type="hidden" name="lang" value="{{ lang }}"/>
            {% endif %}
            <div class="form-group">
                <span class="total">{{ format(gettext("<strong>%(numArtworks)s</strong> found."), {numArtworks: stringNum(total)})|raw }}</span>

                {% if end %}
                    <span class="page">{{ format(gettext("Viewing %(start)s to %(end)s."), {start: stringNum(start), end: stringNum(end)}) }}</span>
                {% endif %}
            </div>
            <div class="form-group">
                <label for="filter" class="control-label">{{ gettext("Query:") }}</label>
                <input type="search" name="filter"
                    placeholder="{{ gettext("Sample: christ or cristo") }}"
                    value="{{query.filter}}" class="form-control"/>
            </div>
            <div class="form-group">
                <label for="artist" class="control-label">{{ gettext("Artist:") }}</label>
                <input type="text" name="artist"
                    placeholder="{{ gettext("Sample: Andrea del Sarto") }}"
                    value="{{query.artist}}" class="form-control"/>
            </div>
            <div class="form-group">
                <label for="date" class="control-label">{{ gettext("Date:") }}</label>
                <input type="text" name="date" class="date-range-picker"
                    value="{{query.date}}" data-min="{{minDate}}" data-max="{{maxDate}}"/>
            </div>
            <div class="form-group">
                <label for="source" class="control-label">{{ gettext("Sources:") }}</label>
                <select name="source" multiple="multiple" style="width: 100%;" class="form-control">
                {% for source in sources %}
                    <option value="{{source._id}}" {% if query.source.indexOf(source._id) >= 0 %} selected{% endif %}>{{source.shortName}}</option>
                {% endfor %}
                </select>
            </div>
            <div class="form-group">
                <input type="submit" value="{{ gettext("Search") }}"
                    class="btn btn-primary"/>
            </div>
        </form>

        <div class="hidden-xs hidden-sm">
        {% for name, cluster in clusters %}
            {% if cluster.buckets.length > 1 %}
                <strong>{% if name === "artists" %}
                    {{ gettext("Artists:") }}
                {% elseif name === "sources" %}
                    {{ gettext("Sources:") }}
                {% endif %}</strong>
                <ul>
                    {% for bucket in cluster.buckets %}
                        <li><a href="{{queryURL({artist:bucket.key})}}">
                            {{bucket.key}} ({{bucket.doc_count}})</a></li>
                    {% endfor %}
                </ul>
            {% endif %}
        {% endfor %}
        </div>
    </div>

    <div class="results-main col-sm-9 col-sm-pull-3">
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

        <div class="row">
        {% for image in images %}
            <div class="img col-xs-6 col-sm-4 col-md-3">
                <a class="img" href="{{ URL(image) }}"
                    title="{{ getTitle(image) }}">
                    <img src="{{ image.getThumbURL() }}"
                        alt="{{ getTitle(image) }}"
                        title="{{ getTitle(image) }}"/>
                </a>
                <div class="details">
                    <div class="wrap">
                        {% if image.dateCreated %}
                            <span>{{ getDate(image.dateCreated) }}</span>
                        {% endif %}

                        {% if image.artist %}
                            {% if image.artist.artist %}
                                <a href="{{ URL(image.artist.artist) }}"
                                    title="{{ fullName(image.artist.artist) }}">
                                    {{ shortName(image.artist.artist) }}</a>
                            {% endif %}
                        {% endif %}

                        <a class="pull-right"
                            href="{{ URL(image.getSource()) }}"
                            title="{{ fullName(image.getSource()) }}">
                            {{ shortName(image.getSource()) }}</a>
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
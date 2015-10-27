{% extends "../layouts/default.swig" %}

{% block title %}{{ __("Index Page") }}{% endblock %}

{% block content %}

<div class="row">
    <h1 class="col-md-12">{{ title }}</h1>
    {% if url %}
        <p class="col-md-12"><a href="{{ url }}">{{ url }}</a></p>
    {% endif %}
</div>

<div id="results">
    <div class="state row">
        <div class="col-md-12">
            <span class="total">{{ __("<strong>%s</strong> found.", stringNum(total))|raw }}</span>
            {% if end %}
                <span class="page">{{ __("Viewing %s to %s.", stringNum(start), stringNum(end)) }}</span>
            {% endif %}
        </div>
    </div>

<div class="row results-wrap">
<div class="results-side">
<div class="results-side-wrap">
<form action="/search" method="GET">
<p>Query: <input type="search" name="filter" value="{{query.filter}}"/></p>
<div>
Artist: <input type="text" name="artist" value="{{query.artist}}"/>
</div>
<div>
    <input type="text" name="date" class="date-range-picker"
        value="{{query.date}}" data-min="{{minDate}}" data-max="{{maxDate}}"/>
</div>
<div>
Sources:
<select name="source" multiple="multiple" style="width: 100%;">
{% for source in sources %}
    <option value="{{source._id}}" {% if query.source.indexOf(source._id) >= 0 %} selected{% endif %}>{{source.shortName}}</option>
{% endfor %}
</select>
</div>
<p><input type="submit" value="Search"/></p>
</form>

{% for name, cluster in clusters %}
    {% if cluster.buckets.length > 1 %}
        <strong>{{name}}</strong>
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
<div class="results-main">
{% for image in images %}
<div class="img">
    <a class="img" href="{{ URL(image) }}"
        title="{{ getTitle(image) }}">
    <img src="{{ image.getThumbURL() }}"
        alt="{{ getTitle(image) }}"
        title="{{ getTitle(image) }}"/></a>
    <div class="details">
        <div class="wrap">
        {% if image.dateCreated %}
            <span class="date">{{ getDate(image.dateCreated) }}</span>
        {% endif %}
        {% if image.artist %}
            {% if image.artist.artist %}
                <a class="artist" href="{{ URL(image.artist.artist) }}"
                    title="{{ fullName(image.artist.artist) }}">
                    {{ shortName(image.artist.artist) }}</a>
            {% endif %}
        {% endif %}
        <a class="source" href="{{ URL(image.source) }}"
            title="{{ fullName(image.source) }}">
            {{ shortName(image.source) }}</a>
        </div>
    </div>
</div>
{% endfor %}
</div>
</div>

<div class="search-nav row col-md-12">
    {% if prev %}
        <span class="prev"><a href="{{ prev }}" class="btn btn-primary"
            rel="prev">&laquo; {{ __("Previous") }}</a></span>
    {% endif %}

    {% if next %}
        <span class="next"><a href="{{ next }}" class="btn btn-primary"
            rel="next">{{ __("Next") }} &raquo;</a></span>
    {% endif %}
</div>

</div>

{% endblock %}
{% extends "../layouts/default.swig" %}

{% block title %}{{ artwork.title }}{% endblock %}

{% block content %}
<div id="result" class="row">
    <div class="col-md-6 imageholder">
        <div class="row">
            <a href="{{ artwork.getOriginalURL(artwork.images[0]) }}">
                <img src="{{ artwork.getScaledURL(artwork.images[0]) }}"
                    alt="{{ getTitle(artwork) }}"
                    title="{{ getTitle(artwork) }}"/></a>
        </div>
        {% if artwork.images.length > 1 %}
        <div class="row">
        {% for image in artwork.images %}
            <div class="img col-md-3">
                <a class="img" href="{{ artwork.getOriginalURL(image) }}">
                    <img src="{{ artwork.getThumbURL(image) }}"
                        alt="{{ getTitle(artwork) }}"
                        title="{{ getTitle(artwork) }}"/></a>
            </div>
        {% endfor %}
        </div>
        {% endif %}
    </div>
    <div class="details col-md-6">
        {% for name in artwork.artists %}
            <p class="row artist">
                <strong class="col-md-3 right">{{ __("Artist:") }}</strong>
                <span class="col-md-9">
                    {% if name.artist %}
                    <a href="{{ URL(name.artist) }}"
                        title="{{ fullName(name.artist) }}">
                        {{ fullName(name.artist) }}</a>
                    {% else %}
                        {{ name.name }}
                    {% endif %}
                </span>
            </p>
        {% endfor %}
        {% if artwork.title %}
            <p class="row title">
                <strong class="col-md-3 right">{{ __("Title:") }}</strong>
                <span class="col-md-9">{{ artwork.title }}</span>
            </p>
        {% endif %}
        {% if artwork.dateCreated %}
            <p class="row date">
                <strong class="col-md-3 right">{{ __("Date:") }}</strong>
                <span class="col-md-9">{{ getDate(artwork.dateCreated) }}</span>
            </p>
        {% endif %}
        {% if artwork.dimensions.length > 0 %}
            <p class="row date">
                <strong class="col-md-3 right">{{ __("Dimensions:") }}</strong>
                <span class="col-md-9">
                    {% for dimension in artwork.dimensions %}
                        {{ getDimension(dimension) }}<br/>
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.medium %}
            <p class="row medium">
                <strong class="col-md-3 right">{{ __("Medium:") }}</strong>
                <span class="col-md-9">{{ artwork.medium }}</span>
            </p>
        {% endif %}
        {% if artwork.objectType %}
            <p class="row objectType">
                <strong class="col-md-3 right">{{ __("Type:") }}</strong>
                <span class="col-md-9">{{ artwork.objectType }}</span>
            </p>
        {% endif %}
        {% if artwork.categories.length > 0 %}
            <p class="row categories">
                <strong class="col-md-3 right">{{ __("Categories:") }}</strong>
                <span class="col-md-9">
                    {% for category in artwork.categories %}
                        {{ category }}<br/>
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.collections.length > 0 %}
            <p class="row categories">
                <strong class="col-md-3 right">{{ __("Collection:") }}</strong>
                <span class="col-md-9">
                    {% for collection in artwork.collections %}
                        {{ collection.name }}<br/>
                        {% if collection.city %}
                            {{ collection.city }}<br/>
                        {% endif %}
                    {% endfor %}
                </span>
            </p>
        {% endif %}
        {% if artwork.url %}
            <p class="row details">
                <strong class="col-md-3 right">
                    {% if artwork.source.commercial %}
                        <small>{{ __("Details &amp;&nbsp;Prices:") }}</small>
                    {% else %}
                        {{ __("Details:") }}
                    {% endif %}
                </strong>
                <span class="col-md-9">
                    {% if artwork.source.inactive %}
                        <small>{{ __("Unfortunately the source of this print no longer exists.") }}</small>
                    {% elif artwork.source.hideLinks %}
                        <small>{{ __("There is no way to link to this print on the source site. Please visit the source and search for the print there.") }}</small>
                    {% elif artwork.source.linkTitle %}
                        <small><a href="{{ artwork.url }}"
                            title="{{ artwork.source.linkTitle }}">
                            {{ getTitle(image) }}</a></small>
                    {% else %}
                        <a href="{{ artwork.url }}">
                            {{ __("More information...") }}</a>
                    {% endif %}
                </span>
            </p>
        {% endif %}
        {% if artwork.source && artwork.source != "uploads" %}
            {% if artwork.source.inactive %}
                <p class="row source">
                    <strong class="col-md-3 right">{{ __("Source:") }}</strong>
                    <span class="col-md-9"><a href="{{ URL(artwork.source) }}" title="{{ fullName(artwork.source) }}">
                        {{ fullName(artwork.source) }}</a></span>
                </p>
            {% else %}
                <p class="row source">
                    <strong class="col-md-3 right">{{ __("Source:") }}</strong>
                    <span class="col-md-9"><a href="{{ artwork.source.url }}">
                        {% if artwork.source.linkText %}
                            {{ artwork.source.linkText }}
                        {% else %}
                            {{ fullName(artwork.source) }}
                        {% endif %}
                    </a><br/>
                    <small><a href="{{ URL(artwork.source) }}" title="{{ fullName(artwork.source) }}">
                        {{ __("Browse all %s prints...", artwork.source.count_string) }}</a></small></span>
                </p>
            {% endif %}
        {% endif %}
        {% if artwork.source && artwork.source === "uploads" %}
            {% if results.length == 0 %}
                <h3>{{ __("Uh oh!") }}</h3>
                <p>{{ __("No other copies of this print have been found.") }}</p>
                <div class="hide-ja">
                <p>It might be worthwhile to copy the uploaded image URL:</p>
                <pre>{{ artwork.getOriginalURL() }}</pre>
                <p>and ask the Ukiyo-e Q&amp;A community for help:</p>
                <p><a href="http://www.ukiyo-e.se/wwwboard/wwwboard.html">
                    http://www.ukiyo-e.se/wwwboard/wwwboard.html</a></p>
                </div>
            {% endif %}
        {% endif %}
    </div>
</div>

<div class="row">
    {% if results.length > 0 %}
    <div class="col-md-8">
        <h2>{{ __("Other Copies") }}
        {% if results.length > 0 %}
            <a href="" class="btn compare-all"><i class="icon-eye-open"></i>
                {{ __("Compare Prints...") }}</a>
        {% endif %}</h2>
    </div>
    {% endif %}
    <div class="{% if results.length > 0 %}col-md-4{% else %}col-md-12{% endif %}">
        <h2>{{ __("Discuss This Print") }}</h2>
    </div>
</div>

<div class="row">

{% if results.length > 0 %}
<div id="results" class="col-md-8">
    <div class="row">
    {% for item in results %}
        {% if item.image %}
        <div class="img col-md-3">
            <a class="img" href="{{ URL(item.image) }}">
                <img src="{{ item.artwork.getThumbURL() }}"
                    alt="{{ getTitle(item.image) }}"
                    title="{{ getTitle(item.image) }}"/></a>
            <div class="details">
                <div class="wrap">
                {% if item.artist %}
                    <a class="artist" href="{{ URL(item.artwork.artist) }}"
                        title="{{ fullName(item.artwork.artist) }}">
                        {{ shortName(item.artwork.artist) }}</a>
                {% endif %}
                <a class="source" href="{{ URL(item.artwork.source) }}"
                    title="{{ fullName(item.artwork.source) }}">
                    {{ shortName(item.artwork.source) }}</a>
                </div>
            </div>
        </div>
        {% endif %}
    {% endfor %}
    </div>
</div>

<div id="image-holder"></div>
<div id="compare">
    <div class="compare-nav left-nav">
        <a href="" class="compare-prev">
            <i class="icon-step-backward icon-white"></i>
            {{ __("Previous") }}</a>
        <a href="" class="compare-next">{{ __("Next") }}
            <i class="icon-step-forward icon-white"></i></a>
    </div>
    <div class="compare-nav right-nav">
        <a href="" class="reset-zoom"><i class="icon-zoom-out icon-white"></i>
            {{ __("Reset Zoom") }}</a>
        <a href="" class="compare-close"><i class="icon-remove icon-white"></i>
            {{ __("Close") }}</a>
    </div>
    <div class="details">
        <a href="" class="source"></a>:
        <a href="" class="artist"></a> -
        <a href="" class="title"></a>
    </div>
    <canvas id="compare-canvas"></canvas>
</div>
{% endif %}

<div id="disqus_thread" class="{% if results.length > 0 %}col-md-4{% else %}col-md-12{% endif %}"></div>

</div>

{% if results.length > 0 && artwork.source === "uploads" %}
<div class="row">
    <div class="col-md-8">
    <h3>{{ __("Learn More") }}</h3>
    {% for group in groups %}
        <p><strong><a href="{{ URL(group.source) }}">
            {{ fullName(group.source) }}</a></strong></p>
        <ul>
        {% for item in group.items %}
            <li><a href="{{ item.source_url }}">{{ item.source_url }}</a></li>
        {% endfor %}
        </ul>
    {% endfor %}
    </div>
</div>
{% endif %}

<script type="text/javascript">
var imageData = {{ image|json_encode|raw }};
var results = {{ results|json_encode|raw }};
</script>

<script type="text/javascript">
var disqus_shortname = 'ukiyoe';

(function() {
    var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
    dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
})();
</script>
{% endblock %}
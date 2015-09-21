{% extends "../layouts/default.swig" %}

{% block title %}{{ image.title }}{% endblock %}

{% block content %}
<div id="result" class="row">
    <div class="col-md-8 imageholder">
        <a href="{{ image.getOriginalURL() }}">
            <img src="{{ image.getScaledURL() }}"
                alt="{{ getTitle(image) }}"
                title="{{ getTitle(image) }}"/></a>
    </div>
    <div class="details col-md-4">
        {% for name in image.artists %}
            <p class="row artist">
                <strong class="col-md-3 right">{{ __("Artist:") }}</strong>
                <span class="col-md-9">
                    {% if name.artist %}
                    <a href="{{ URL(name.artist) }}"
                        title="{{ fullName(name.artist) }}">
                        {{ fullName(name.artist) }}</a>
                    {% else %}
                        {{ fullName(name.names[0]) }}
                    {% endif %}
                </span>
            </p>
        {% endfor %}
        {% if image.title %}
            <p class="row title">
                <strong class="col-md-3 right">{{ __("Title:") }}</strong>
                <span class="col-md-9">{{ image.title }}</span>
            </p>
        {% endif %}
        {% if image.dateCreated %}
            <p class="row date">
                <strong class="col-md-3 right">{{ __("Date:") }}</strong>
                <span class="col-md-9">{{ getDate(image.dateCreated) }}</span>
            </p>
        {% endif %}
        {% if image.url %}
            <p class="row details">
                <strong class="col-md-3 right">
                    {% if image.source.commercial %}
                        <small>{{ __("Details &amp;&nbsp;Prices:") }}</small>
                    {% else %}
                        {{ __("Details:") }}
                    {% endif %}
                </strong>
                <span class="col-md-9">
                    {% if image.source.inactive %}
                        <small>{{ __("Unfortunately the source of this print no longer exists.") }}</small>
                    {% elif image.source.hideLinks %}
                        <small>{{ __("There is no way to link to this print on the source site. Please visit the source and search for the print there.") }}</small>
                    {% elif image.source.linkTitle %}
                        <small><a href="{{ image.url }}"
                            title="{{ image.source.linkTitle }}">
                            {{ getTitle(image) }}</a></small>
                    {% else %}
                        <a href="{{ image.url }}">
                            {{ __("More information...") }}</a>
                    {% endif %}
                </span>
            </p>
        {% endif %}
        {% if image.source && image.source != "uploads" %}
            {% if image.source.inactive %}
                <p class="row source">
                    <strong class="col-md-3 right">{{ __("Source:") }}</strong>
                    <span class="col-md-9"><a href="{{ URL(image.source) }}" title="{{ fullName(image.source) }}">
                        {{ fullName(image.source) }}</a></span>
                </p>
            {% else %}
                <p class="row source">
                    <strong class="col-md-3 right">{{ __("Source:") }}</strong>
                    <span class="col-md-9"><a href="{{ image.source.url }}">
                        {% if image.source.linkText %}
                            {{ image.source.linkText }}
                        {% else %}
                            {{ fullName(image.source) }}
                        {% endif %}
                    </a><br/>
                    <small><a href="{{ URL(image.source) }}" title="{{ fullName(image.source) }}">
                        {{ __("Browse all %s prints...", image.source.count_string) }}</a></small></span>
                </p>
            {% endif %}
        {% endif %}
        {% if image.source && image.source === "uploads" %}
            {% if results.length == 0 %}
                <h3>{{ __("Uh oh!") }}</h3>
                <p>{{ __("No other copies of this print have been found.") }}</p>
                <div class="hide-ja">
                <p>It might be worthwhile to copy the uploaded image URL:</p>
                <pre>{{ image.getOriginalURL() }}</pre>
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
                <img src="{{ item.image.getThumbURL() }}"
                    alt="{{ getTitle(item.image) }}"
                    title="{{ getTitle(item.image) }}"/></a>
            <div class="details">
                <div class="wrap">
                {% if item.artist %}
                    <a class="artist" href="{{ URL(item.image.artist) }}"
                        title="{{ fullName(item.image.artist) }}">
                        {{ shortName(item.image.artist) }}</a>
                {% endif %}
                <a class="source" href="{{ URL(item.image.source) }}"
                    title="{{ fullName(item.image.source) }}">
                    {{ shortName(item.image.source) }}</a>
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

{% if results.length > 0 && image.source === "uploads" %}
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
{% extends "../layouts/default.swig" %}

{% block title %}{{ __("Search Japanese Woodblock Prints") }}{% endblock %}

{% block content %}
<div id="search-box" class="row">
    <div class="col-md-12">
        <h2 class="hidden-phone">{{ __("Japanese Woodblock Print Search") }}</h2>

        <p class="hidden-phone">{{ __("Ukiyo-e Search provides an incredible resource: The ability to both search for Japanese woodblock prints by simply taking a picture of an existing print AND the ability to see similar prints across multiple collections of prints. Below is an example print, click to see it in action.") }}</p>
    </div>

    <div class="col-md-7 image-example">
        <a href="{{ URL("/image/met/DP141256") }}">
            <img src="http://data.ukiyo-e.org/met/thumbs/DP141256.jpg"
                style="width:220px;height:220px;"
                class="hidden-phone large-image" /></a>
        <a href="{{ URL("/image/met/DP141256") }}">
            {{ CDN("/images/example-compare.png", {"style": "height:220px;width:446px;", "class": "hidden-phone"}) }}</a>
    </div>

    <div class="col-md-5 upload-box">
        <h4>{{ __("Search %s prints:", stringNum(total)) }}</h4>
        <form action="/search" method="GET" class="form-search search">
            <div class="form-group">
                <input type="search" id="q" name="q" placeholder="{{ __("Search") }}" class="form-control search-query" />
                <input type="submit" value="{{ __("Search") }}" class="btn btn-primary" />
            </div>
        </form>

        <h4>{{ __("Search by Image:") }}</h4>
        <p>{{ __("Upload a picture of a print to find similar prints across multiple collections.") }}</p>

        <div class="tabblable">
            <ul class="nav nav-tabs nav-justified">
                <li class="active"><a href="#upload" data-toggle="tab">{{ __("Upload an Image") }}</a></li>
                <li><a href="#paste" data-toggle="tab">{{ __("Paste image URL") }}</a></li>
            </ul>
            <form action="/upload" method="POST" enctype="multipart/form-data" class="upload">
                <input type="hidden" name="_csrf" value="{{ csrf_token }}"/>
                <input type="hidden" name="test" value=""/>
                <div class="tab-content">
                    <div class="tab-pane active" id="upload">
                        <div class="form-group">
                            <input type="file" id="file" name="file" class="form-control" />
                            <input type="submit" value="{{ __("Search by Image") }}" class="btn btn-primary" />
                        </div>
                    </div>
                    <div class="tab-pane" id="paste">
                        <div class="form-group">
                            <input type="text" id="url" name="url" value="http://" class="form-control" />
                            <input type="submit" value="{{ __("Search by Image") }}" class="btn btn-primary" />
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div class="alert alert-info hidden-phone hide-ja">
            <strong>Update (<a href="http://blog.ukiyo-e.org/2014/03/japanese-prints-at-nyc-asia-week-2014/">NYC Asia Week 2014</a>):</strong> 3 new sources added!
            <ol>
                <li><a href="{{ URL("/source/artofjapan") }}">The Art of Japan (1,399 images)</a></li>
                <li><a href="{{ URL("/source/robynbuntin") }}">Robyn Buntin of Honolulu (4,310 images)</a></li>
                <li><a href="{{ URL("/source/scholten") }}">Scholten Japanese Art (854 images)</a></li>
              </ol>
        </div>
    </div>
</div>

<div class="row hidden-phone hide-ja">
    <div class="col-md-8">
        <div class="alert alert-success">
            Better data, hundreds of thousands of additional images, and better search capabilities are forthcoming. Sign-up to be notified when additional features are ready.
        </div>
    </div>
    <div class="col-md-4 hidden-phone">
        <form action="http://jquery.us1.list-manage1.com/subscribe/post?u=9d97dbe5f30bdee8c85a45e9e&amp;id=e32c42f014" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate form-horizontal" target="_blank">
            <h4>Subscribe for Updates</h4>
            <div class="mc-field-group">
                <input type="email" value="" name="EMAIL" class="required email input-medium form-control" id="mce-EMAIL" placeholder="Email Address">
                <input type="submit" value="Subscribe" name="subscribe" id="mc-embedded-subscribe" class="button btn btn-success">
            </div>
        </form>
    </div>
</div>

<div id="results" class="ages">
    {% for era in eras %}
        <h2>{{ __(era.name) }}</h2>
        <div class="row">
        {% for artist in era.artists %}
            <div class="img col-md-3" data-slug="{{ artist.slug }}">
                <a class="img" href="{{ URL(artist) }}">
                    <img src="{{ artist.repImage.thumb }}" alt="{{ fullName(artist) }}"/></a>
                <div class="details">
                    <div class="wrap">
                    <a class="artist" href="{{ URL(artist) }}" title="{{ fullName(artist) }}">{{ fullName(artist) }}</a>
                    ({{ artist.printCount }})
                    </div>
                </div>
          </div>
        {% endfor %}
        </div>
    {% endfor %}
</div>
{% endblock %}

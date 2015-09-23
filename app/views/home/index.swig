{% extends "../layouts/default.swig" %}

{% block title %}{{ SITE_NAME }}{% endblock %}

{% block content %}
<div id="search-box" class="row">
    <div class="col-md-12">
        <h2 class="hidden-phone">{{ SITE_NAME }}</h2>

        <p class="hidden-phone">...</p>
    </div>

    <div class="col-md-7 image-example">
        ...
    </div>

    <div class="col-md-5 upload-box">
        <h4>{{ __("Search %s artworks:", stringNum(total)) }}</h4>
        <form action="/search" method="GET" class="form-search search">
            <div class="form-group">
                <input type="search" id="q" name="q" placeholder="{{ __("Search") }}" class="form-control search-query" />
                <input type="submit" value="{{ __("Search") }}" class="btn btn-primary" />
            </div>
        </form>

        <h4>{{ __("Search by Image:") }}</h4>
        <p>{{ __("Upload a picture of an artwork to find similar artworks across multiple collections.") }}</p>

        <div class="tabblable">
            <ul class="nav nav-tabs nav-justified">
                <li class="active"><a href="#upload" data-toggle="tab">{{ __("Upload an Image") }}</a></li>
                <li><a href="#paste" data-toggle="tab">{{ __("Paste Image URL") }}</a></li>
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

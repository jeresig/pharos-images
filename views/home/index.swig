{% extends "../layouts/default.swig" %}

{% block title %}{{ SITE_NAME }}{% endblock %}

{% block content %}
<div class="home-contents row">
    <div class="col-md-6 col-md-offset-3 upload-box">
        <h3>{{ __("Search %s Artworks:", stringNum(total)) }}</h3>
        <form action="/search" method="GET" class="form-search search">
            <div class="form-group">
                <input type="search" id="filter" name="filter" placeholder="{{ __("Search") }}" class="form-control search-query" />
                <input type="submit" value="{{ __("Search") }}" class="btn btn-primary" />
            </div>
        </form>

        <h3>{{ __("Search by Image:") }}</h3>
        <p>{{ __("Upload a picture of an artwork to find similar artworks across multiple collections.") }}</p>

        <div class="tabblable">
            <ul class="nav nav-tabs nav-justified">
                <li class="active"><a href="#upload" data-toggle="tab">{{ __("Upload an Image") }}</a></li>
                <li><a href="#paste" data-toggle="tab">{{ __("Paste Image URL") }}</a></li>
            </ul>
            <form action="/upload" method="POST" enctype="multipart/form-data" class="upload">
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

        <h3>{{ __("Browse by Collection:") }}</h3>

        <div class="sources">
            {% for source in sources %}
            <h4><a href="{{ URL(source) }}">{{ fullName(source) }}</a></h4>
            <p>{{ __("%s Artworks", stringNum(source.numArtworks)) }}</p>
            {% endfor %}
        </div>
    </div>
</div>
{% endblock %}

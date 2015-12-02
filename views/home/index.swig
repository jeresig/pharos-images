{% extends "../layouts/default.swig" %}

{% block title %}{{ SITE_NAME }}{% endblock %}

{% block content %}
<div class="home-contents row">
    <div class="col-sm-8 col-sm-offset-2 upload-box">
        <h3>{{ format(gettext("Search %(count)s Artworks:"), {count: stringNum(total)}) }}</h3>
        <form action="{{ URL("/search") }}" method="GET" class="form-search search form-inline">
            <div class="form-group">
                {% if qsLocale() %}
                    <input type="hidden" name="lang" value="{{ lang }}"/>
                {% endif %}
                <input type="search" id="filter" name="filter" placeholder="{{ gettext("Search") }}" class="form-control search-query" />
            </div>
            <input type="submit" value="{{ gettext("Search") }}" class="btn btn-primary" />
            <a href="{{ URL("/search") }}" class="btn btn-default">{{ gettext("Browse All") }}</a>
        </form>

        <h3>{{ gettext("Search by Image:") }}</h3>
        <p>{{ gettext("Upload a picture of an artwork to find similar artworks across multiple collections.") }}</p>
        
        <form action="/upload" method="POST" enctype="multipart/form-data" class="upload">
            {% if qsLocale() %}
                <input type="hidden" name="lang" value="{{ lang }}"/>
            {% endif %}

            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">{{ gettext("Upload an Image") }}</h3>
                </div>
                <div class="panel-body">
                    <div class="form-inline">
                        <div class="form-group">
                            <input type="file" id="file" name="file" class="form-control" />
                        </div>
                        <input type="submit" value="{{ gettext("Search by Image") }}" class="btn btn-primary" />
                    </div>
                </div>
            </div>

            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">{{ gettext("Paste Image URL") }}</h3>
                </div>
                <div class="panel-body">
                    <div class="form-inline">
                        <div class="form-group">
                            <input type="text" id="url" name="url" value="http://" class="form-control" />
                        </div>
                        <input type="submit" value="{{ gettext("Search by Image") }}" class="btn btn-primary" />
                    </div>
                </div>
            </div>
        </form>

        <h3>{{ gettext("Browse by Collection:") }}</h3>

        <div class="sources">
            {% for source in sources %}
            <h4><a href="{{ URL(source) }}">{{ fullName(source) }}</a></h4>
            <p>{{ format(gettext("%(count)s Artworks"), {count: stringNum(source.numArtworks)}) }}</p>
            {% endfor %}
        </div>
    </div>
</div>
{% endblock %}

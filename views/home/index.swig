{% extends "../layouts/default.swig" %}

{% block title %}{{ SITE_NAME }}{% endblock %}

{% block content %}
<div class="home-contents row">
    <div class="col-md-6 col-md-offset-3 upload-box">
        <h3>{{ format(gettext("Search %(count)s Artworks:"), {count: stringNum(total)}) }}</h3>
        <form action="{{ URL("/search") }}" method="GET" class="form-search search">
            <div class="form-group">
                {% if qsLocale() %}
                    <input type="hidden" name="lang" value="{{ lang }}"/>
                {% endif %}
                <input type="search" id="filter" name="filter" placeholder="{{ gettext("Search") }}" class="form-control search-query" />
                <input type="submit" value="{{ gettext("Search") }}" class="btn btn-primary" />
                <a href="{{ URL("/search") }}" class="btn btn-default">{{ gettext("Browse All") }}</a>
            </div>
        </form>

        <h3>{{ gettext("Search by Image:") }}</h3>
        <p>{{ gettext("Upload a picture of an artwork to find similar artworks across multiple collections.") }}</p>

        <div class="tabblable">
            <ul class="nav nav-tabs nav-justified">
                <li class="active"><a href="#upload" data-toggle="tab">{{ gettext("Upload an Image") }}</a></li>
                <li><a href="#paste" data-toggle="tab">{{ gettext("Paste Image URL") }}</a></li>
            </ul>
            <form action="/upload" method="POST" enctype="multipart/form-data" class="upload">
                {% if qsLocale() %}
                    <input type="hidden" name="lang" value="{{ lang }}"/>
                {% endif %}
                <div class="tab-content">
                    <div class="tab-pane active" id="upload">
                        <div class="form-group">
                            <input type="file" id="file" name="file" class="form-control" />
                            <input type="submit" value="{{ gettext("Search by Image") }}" class="btn btn-primary" />
                        </div>
                    </div>
                    <div class="tab-pane" id="paste">
                        <div class="form-group">
                            <input type="text" id="url" name="url" value="http://" class="form-control" />
                            <input type="submit" value="{{ gettext("Search by Image") }}" class="btn btn-primary" />
                        </div>
                    </div>
                </div>
            </form>
        </div>

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

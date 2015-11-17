{% extends "../layouts/default.swig" %}

{% block title %}{{ __("About The Site") }}{% endblock %}

{% block content %}
<div id="overview" class="row">
    <div id="about" class="col-md-12">
        <h2>{{ __("About The Site") }}</h2>

        <p>The Ukiyo-e.org database and image similarity analysis engine, created by John Resig to aide researchers in the study of Japanese woodblock prints, was launched in December 2012. The database currently contains over 213,000 prints from 24 institutions and, as of September 2013, has received 3.4 million page views from 150,000 people.</p>

        <p>The database has the following major features:</p>

        <ul>
        <li>A database of Japanese woodblock print images and metadata aggregated from a variety of museums, universities, libraries, auction houses, and dealers around the world.</li>
        <li>An indexed text search engine of all the metadata provided by the institutions about the prints.</li>
        <li>An image search engine of all the images in the database, searchable by uploading an image of a print.</li>
        <li>Each print image is analyzed and compared against all other print images in the database. Similar prints are displayed together for comparison and analysis.</li>
        <li>Multiple copies of the same print are automatically lined up with each other and made viewable in a gallery for easy comparison.</li>
        <li>The entire web site, and all artist information contained within it, is available in both English and Japanese, aiding international researchers.</li>
        </ul>

        <p>These features, available in the Ukiyo-e.org database, are already providing researchers with substantial benefit. New copies of prints have been located by scholars at museums. Museums have been able to correct unattributed prints, finding the correct artist. Prints have been identified by lay people who cannot read Japanese and/or are unable to interpret the imagery depicted in a print.</p>

        <p>It is challenging to reconcile information from numerous databases, many of which are in different languages. The difficulty of finding and utilizing an effective image similarity search engine, one that is capable of working with images of different sizes, colors, or even in black-and-white, is a point that deserves considerable attention.</p>

        <p>The Ukiyo-e.org database is already significantly impacting Japanese woodblock print studies and may have implications for visual art research and digital humanities at large.</p>

        <h2>{{ __("Video Overview") }}</h2>

        <p>The following is a video presentation that was given at the <a href="http://www.dh-jac.net/jadh2013/">JADH 2013</a> conference in Kyoto, detailing how the Ukiyo-e.org website was built and what effect it's had on Ukiyo-e researchers.</p>

        <p><iframe src="//player.vimeo.com/video/74691102?byline=0&amp;portrait=0" width="768" height="576" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></p>

        <h2>{{ __("About John Resig") }}</h2>
        <img src="{{ CDN("/images/john-medium.jpg", {"raw": true}) }}" alt="John Resig at Christie's Auction" style="float:right; margin-left: 10px;" />
        <p><strong>Ukiyo-e.org</strong> was created by <a href="http://ejohn.org/about">John Resig</a>, a computer programmer and avid enthusiast of Japanese woodblock prints.</p>
        <p>John has recently become a Visiting Researcher at <a href="http://www.ritsumei.ac.jp/eng/">Ritsumeikan University</a> in Kyoto working on the <a href="http://www.ritsumei.ac.jp/eng/html/research/areas/feat-projects/art/05-02-kabuki.html/">study of Ukiyo-e</a>.</p>
        <p>In his personal research he saw a need for a tool that did not exist: some way of easily finding similar prints across multiple collections simultaneously. After going through multiple revisions the Ukiyo-e.org web site and database was born.</p>
        <p>If you have any questions please contact him at: <a href="mailto:jeresig@gmail.com">jeresig@gmail.com</a>.</p>

        <h2>{{ __("Contributors") }}</h2>

        <p>The following people have provided substantial code contributions to the Ukiyo-e.org web site:</p>

        <ul>
            <li><a href="http://siznax.net/">Steve Sisney</a></li>
        </ul>
    </div>
</div>
{% endblock %}

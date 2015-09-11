<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
{% for site in sites %}
{% if site %}
  <url>
    <loc>{{ site.url }}</loc>
    {% if site.image %}
    <image:image>
       <image:loc>{{ site.image }}</image:loc>
    </image:image>
    {% endif %}
  </url>
{% endif %}
{% endfor %}
</urlset>
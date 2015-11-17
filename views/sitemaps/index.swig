<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{% for sitemap in sitemaps %}
{% if sitemap %}
  <sitemap>
    <loc>{{ sitemap.url }}</loc>
  </sitemap>
{% endif %}
{% endfor %}
</sitemapindex>

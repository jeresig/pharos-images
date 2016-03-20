{% extends "page.swig" %}

{% block title %}{{ gettext("Login") }}{% endblock %}

{% block content %}
<h1>{{ gettext("Login") }}</h1>

<form action="{{ URL("/login") }}" method="post">
    <div>
        <label for="email">{{ gettext("Email Address:") }}</label>
        <input type="text" name="email"/>
    </div>
    <div>
        <label for="password">{{ gettext("Password:") }}</label>
        <input type="password" name="password"/>
    </div>
    <div>
        <input type="submit" value="{{ gettext("Login") }}"/>
    </div>
</form>
{% endblock %}
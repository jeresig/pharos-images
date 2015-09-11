{% extends "../layouts/default.swig" %}

{% block title %}Login{% endblock %}

{% block content %}
<p>Don't have an account? <a href="/signup">Signup for an account</a>.</p>
<form action="/users/session" method="post">
<div>
    <label for="email">Email</label>
    <input type="email" name="email"/>
</div>
<div>
    <label for="password">Password</label>
    <input type="password" name="password"/>
</div>
<input type="submit" value="Login"/>
</form>
{% endblock %}
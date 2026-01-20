<script lang="ts">
    let { data } = $props(); // Svelte 5 way to get data from the server
</script>

<h1>Dashboard</h1>
<p>Welcome back, <strong>{data.user.username}</strong>!</p>
<p>Your ID: {data.user.id}</p>

<form method="POST" action="/logout">
    <button type="submit">Logout</button>
</form>
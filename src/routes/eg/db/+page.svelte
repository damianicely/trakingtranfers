<script lang="ts">
    let { data } = $props(); // Svelte 5 syntax
</script>

<h1>Database Test</h1>
<p>The server time is: {data.serverTime}</p>
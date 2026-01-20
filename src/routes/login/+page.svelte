<script lang="ts">
	let { form } = $props();
</script>

<h1>Log In</h1>

{#if form?.message}
	<p style="color: red;">{form.message}</p>
{/if}

<form method="POST">
	<div>
		<label for="username">Username</label>
		<input name="username" id="username" type="text" required />
	</div>

	<div>
		<label for="password">Password</label>
		<input name="password" id="password" type="password" required />
	</div>

	<button type="submit">Sign In</button>
</form>

<p>Need an account? <a href="/register">Register</a></p>
<script lang="ts">
	let { form } = $props(); // Svelte 5 way to get action results
</script>

<h1>Create an Account</h1>

{#if form?.message}
	<p style="color: red;">{form.message}</p>
{/if}

<form method="POST">
	<div>
		<label for="username">Username</label>
		<input name="username" id="username" type="text" required minlength="3" />
	</div>

	<div>
		<label for="password">Password</label>
		<input name="password" id="password" type="password" required minlength="6" />
	</div>

	<button type="submit">Register</button>
</form>

<p>Already have an account? <a href="/login">Log in</a></p>
<script lang="ts">
	let { data, form } = $props();
</script>

{#if !data.tokenValid}
	<h1>Set Password</h1>
	<p>This link is invalid or has expired. Please request a new password setup link.</p>
{:else}
	<h1>Set Your Password</h1>

	{#if form?.message}
		<p style="color: red;">{form.message}</p>
	{/if}

	<form method="POST">
		<div>
			<label for="password">New Password</label>
			<input name="password" id="password" type="password" required minlength="6" />
		</div>

		<div>
			<label for="confirmPassword">Confirm Password</label>
			<input name="confirmPassword" id="confirmPassword" type="password" required minlength="6" />
		</div>

		<button type="submit">Set Password</button>
	</form>

	<p>After setting your password, you can log in from the <a href="/login">login page</a>.</p>
{/if}


<script lang="ts">
	let { form } = $props();
	let showForgotPassword = $state(false);
</script>

<h1>Log In</h1>

{#if form?.message}
	<p style="color: red;">{form.message}</p>
{/if}

{#if form?.success}
	<p style="color: green;">{form.message || 'If that email exists, a password reset link has been sent. Check your console for the link (email integration pending).'}</p>
{/if}

{#if !showForgotPassword}
	<form method="POST" action="?/login">
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

	<p>
		<a href="#" onclick={(e) => { e.preventDefault(); showForgotPassword = true; }}>Forgot your password?</a>
	</p>

	<p>Need an account? <a href="/register">Register</a></p>
{:else}
	<h2>Reset Password</h2>
	<p>Enter your email address and we'll send you a password reset link.</p>

	<form method="POST" action="?/requestPasswordReset">
		<div>
			<label for="email">Email</label>
			<input name="email" id="email" type="email" required />
		</div>

		<button type="submit">Send Reset Link</button>
	</form>

	<p>
		<a href="#" onclick={(e) => { e.preventDefault(); showForgotPassword = false; }}>Back to login</a>
	</p>
{/if}
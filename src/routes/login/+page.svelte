<script lang="ts">
	let { form } = $props();
	let showForgotPassword = $state(false);
</script>

<div class="auth-container">
	<div class="auth-card">
		{#if !showForgotPassword}
			<h1>Log In</h1>
			<p class="subtitle">Sign in to your account</p>

			{#if form?.message && !form?.success}
				<div class="alert alert-error">{form.message}</div>
			{/if}

			<form method="POST" action="?/login" class="auth-form">
				<div class="form-group">
					<label for="username">Username</label>
					<input name="username" id="username" type="text" required />
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input name="password" id="password" type="password" required />
				</div>

				<button type="submit" class="btn-primary">Sign In</button>
			</form>

			<div class="auth-links">
				<button type="button" class="link-button" onclick={() => { showForgotPassword = true; }}>
					Forgot your password?
				</button>
			</div>

			<div class="auth-footer">
				<p>Need an account? <a href="/register">Register</a></p>
			</div>
		{:else}
			<h1>Reset Password</h1>
			<p class="subtitle">Enter your email address and we'll send you a password reset link.</p>

			{#if form?.success}
				<div class="alert alert-success">
					{form.message || 'If that email exists, a password reset link has been sent. Check your console for the link (email integration pending).'}
				</div>
			{/if}

			{#if form?.message && !form?.success}
				<div class="alert alert-error">{form.message}</div>
			{/if}

			<form method="POST" action="?/requestPasswordReset" class="auth-form">
				<div class="form-group">
					<label for="email">Email</label>
					<input name="email" id="email" type="email" required />
				</div>

				<button type="submit" class="btn-primary">Send Reset Link</button>
			</form>

			<div class="auth-footer">
				<p>
					<button type="button" class="link-button" onclick={() => { showForgotPassword = false; }}>
						Back to login
					</button>
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-container {
		min-height: calc(100vh - 60px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.auth-card {
		background: white;
		border-radius: 12px;
		padding: 3rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
		font-weight: 700;
		color: #1a1a1a;
		text-align: center;
	}

	.subtitle {
		margin: 0 0 2rem 0;
		color: #666;
		text-align: center;
		font-size: 0.95rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #333;
	}

	.form-group input {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}

	.btn-primary {
		padding: 0.75rem 2rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
		margin-top: 0.5rem;
	}

	.btn-primary:hover {
		background: #0056b3;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.alert-error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.alert-success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.auth-links {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.link-button {
		background: none;
		border: none;
		color: #007bff;
		text-decoration: none;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
	}

	.link-button:hover {
		text-decoration: underline;
	}

	.auth-footer {
		text-align: center;
		padding-top: 1.5rem;
		border-top: 1px solid #e9ecef;
		color: #666;
		font-size: 0.9rem;
	}

	.auth-footer a {
		color: #007bff;
		text-decoration: none;
		font-weight: 600;
	}

	.auth-footer a:hover {
		text-decoration: underline;
	}

	.auth-footer .link-button {
		color: #007bff;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.auth-container {
			padding: 1rem;
		}

		.auth-card {
			padding: 2rem 1.5rem;
		}

		h1 {
			font-size: 1.75rem;
		}
	}
</style>

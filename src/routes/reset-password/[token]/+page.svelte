<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="auth-container">
	<div class="auth-card">
		{#if !data.tokenValid}
			<div class="auth-header">
				<div class="auth-logo">Traking</div>
				<h1 class="auth-title">Invalid Link</h1>
				<p class="auth-subtitle">This password reset link is invalid or has expired.</p>
			</div>
			<div class="alert alert-error">
				Please request a new password setup link from the <a href="/login">login page</a>.
			</div>
		{:else}
			<div class="auth-header">
				<div class="auth-logo">Traking</div>
				<h1 class="auth-title">Set Your Password</h1>
				<p class="auth-subtitle">Choose a secure password for your account</p>
			</div>

			{#if form?.message}
				<div class="alert alert-error">{form.message}</div>
			{/if}

			<form method="POST" class="auth-form">
				<div class="form-group">
					<label for="password">New Password</label>
					<div class="input-wrapper">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
						</svg>
						<input
							name="password"
							id="password"
							type="password"
							placeholder="••••••••"
							required
							minlength="6"
						/>
					</div>
					<small class="form-hint">Minimum 6 characters</small>
				</div>

				<div class="form-group">
					<label for="confirmPassword">Confirm Password</label>
					<div class="input-wrapper">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
						</svg>
						<input
							name="confirmPassword"
							id="confirmPassword"
							type="password"
							placeholder="••••••••"
							required
							minlength="6"
						/>
					</div>
				</div>

				<button type="submit" class="btn-primary">Set Password</button>
			</form>

			<div class="auth-footer">
				<p>After setting your password, you can <a href="/login">log in</a>.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Inter', sans-serif;
	}

	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: #f5f5f0;
	}

	.auth-card {
		background: #ffffff;
		width: 100%;
		max-width: 440px;
		border-radius: 16px;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.auth-header {
		padding: 2rem 2rem 1rem;
		text-align: center;
	}

	.auth-logo {
		font-family: 'Playfair Display', serif;
		font-size: 1.75rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
	}

	.auth-logo::after {
		content: '';
		display: block;
		width: 40px;
		height: 3px;
		background: #c4a77d;
		margin: 0.75rem auto 0;
		border-radius: 2px;
	}

	.auth-title {
		font-family: 'Playfair Display', serif;
		font-size: 1.5rem;
		font-weight: 500;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
	}

	.auth-subtitle {
		font-size: 0.9375rem;
		color: #666666;
		margin: 0;
	}

	.auth-form {
		padding: 0 2rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #333333;
	}

	.input-wrapper {
		position: relative;
	}

	.input-wrapper svg {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		width: 20px;
		height: 20px;
		color: #666666;
		pointer-events: none;
	}

	.form-group input {
		width: 100%;
		padding: 0.875rem 1rem 0.875rem 2.75rem;
		border: 1.5px solid #e0e0e0;
		border-radius: 10px;
		font-family: inherit;
		font-size: 0.9375rem;
		color: #1a1a1a;
		background: #ffffff;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #c4a77d;
		box-shadow: 0 0 0 4px rgba(196, 167, 125, 0.1);
	}

	.form-group input::placeholder {
		color: #999;
	}

	.form-hint {
		font-size: 0.8rem;
		color: #666;
		margin-top: -0.25rem;
	}

	.btn-primary {
		width: 100%;
		padding: 1rem;
		background: #c4a77d;
		color: #ffffff;
		border: none;
		border-radius: 10px;
		font-family: inherit;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.btn-primary:hover {
		background: #a08960;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(196, 167, 125, 0.4);
	}

	.alert {
		padding: 0.875rem 1rem;
		border-radius: 10px;
		font-size: 0.9375rem;
		margin: 1rem 2rem;
	}

	.alert-error {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
		border: 1px solid rgba(220, 38, 38, 0.2);
	}

	.alert-error a {
		color: #dc2626;
		text-decoration: underline;
		font-weight: 600;
	}

	.auth-footer {
		padding: 1.5rem 2rem;
		background: #f5f5f0;
		text-align: center;
	}

	.auth-footer p {
		font-size: 0.9375rem;
		color: #333333;
		margin: 0;
	}

	.auth-footer a {
		color: #c4a77d;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.auth-footer a:hover {
		color: #a08960;
	}

	@media (max-width: 480px) {
		.auth-container {
			padding: 1rem;
		}

		.auth-card {
			border-radius: 12px;
		}

		.auth-header {
			padding: 1.5rem 1.5rem 1rem;
		}

		.auth-form {
			padding: 0 1.5rem 1.5rem;
		}

		.alert {
			margin: 1rem 1.5rem;
		}

		.auth-footer {
			padding: 1.25rem 1.5rem;
		}
	}
</style>

<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { openLoginModal } from '$lib/stores/loginModal';
	import { browser } from '$app/environment';

	let { data } = $props();

	const isOwnerDashboard = $derived(
		$page.url.pathname === '/dashboard' && data?.user?.role === 'owner'
	);

	onMount(() => {
		language.init();
	});

	const t = $derived(translations[$language]);
	const currentYear = new Date().getFullYear();

	let showModal = $state(false);
	let showForgotPassword = $state(false);
	let loginError = $state('');
	let resetSuccess = $state('');
	let resetError = $state('');
	let loginSubmitting = $state(false);
	let resetSubmitting = $state(false);

	$effect(() => {
		const open = $openLoginModal;
		if (open) {
			showModal = true;
			showForgotPassword = false;
			loginError = '';
			resetSuccess = '';
			resetError = '';
		}
	});

	function closeModal() {
		showModal = false;
		openLoginModal.set(false);
	}

	async function handleLoginSubmit(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		loginError = '';
		loginSubmitting = true;
		try {
			const res = await fetch('/login?/login', {
				method: 'POST',
				body: formData,
				credentials: 'include',
				headers: { Accept: 'application/json' }
			});
			console.log('[login modal] response:', { status: res.status, ok: res.ok, contentType: res.headers.get('Content-Type') });
			const raw = await res.text();
			console.log('[login modal] raw body:', raw?.slice(0, 300));
			let result: Record<string, unknown> = {};
			try {
				result = JSON.parse(raw || '{}');
			} catch (_) {
				console.log('[login modal] body is not JSON');
			}
			console.log('[login modal] parsed result:', result);
			// SvelteKit form action returns { type, status, data } where data can be a stringified tuple
			let redirectUrl: string | null = null;
			if (res.ok && (result as any)?.type === 'success') {
				const d = (result as any).data;
				if (typeof d === 'string') {
					try {
						const parsed = JSON.parse(d) as unknown;
						if (Array.isArray(parsed) && parsed.length >= 3 && parsed[1] === true && typeof parsed[2] === 'string') {
							redirectUrl = parsed[2];
						}
					} catch (_) {
						// ignore
					}
				} else if (d && typeof d === 'object' && typeof (d as Record<string, unknown>).redirectTo === 'string') {
					redirectUrl = (d as Record<string, unknown>).redirectTo as string;
				}
			}
			// Also support plain JSON { success: true, redirectTo: string } from the login action
			if (!redirectUrl && res.ok && typeof (result as any)?.redirectTo === 'string') {
				redirectUrl = (result as any).redirectTo as string;
			}
			if (res.ok && redirectUrl) {
				console.log('[login modal] success branch: closing modal, redirecting to', redirectUrl);
				closeModal();
				window.location.href = redirectUrl;
				return;
			}
			const msg = (result?.data && typeof (result.data as Record<string, unknown>).message === 'string'
				? (result.data as Record<string, unknown>).message
				: result?.message) as string | undefined;
			if (msg) loginError = msg;
		} catch (err) {
			console.error('[login modal] submit error:', err);
			loginError = 'Something went wrong. Please try again.';
		} finally {
			loginSubmitting = false;
		}
	}

	async function handleResetSubmit(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		resetSuccess = '';
		resetError = '';
		resetSubmitting = true;
		try {
			const res = await fetch('/login?/requestPasswordReset', {
				method: 'POST',
				body: formData,
				credentials: 'include'
			});
			const result = await res.json();
			if (result?.success) {
				resetSuccess = result.message || 'If that email exists, a reset link has been sent.';
			} else if (result?.message) {
				resetError = result.message;
			}
		} catch (_) {
			resetError = 'Something went wrong. Please try again.';
		} finally {
			resetSubmitting = false;
		}
	}
</script>

{#if !isOwnerDashboard}
	<header class="header">
		<div class="container">
			<a href="/" class="logo">TrakingTransfers.pt</a>
			<div class="header-right">
				{#if data?.user}
					<a href="/dashboard" class="header-link">Dashboard</a>
					<form method="POST" action="/logout" class="logout-form-inline">
						<button type="submit" class="header-btn header-btn-logout">Log out</button>
					</form>
				{:else}
					<button type="button" class="header-btn header-btn-login" onclick={() => { showModal = true; openLoginModal.set(true); }}>Login</button>
				{/if}
				<span class="separator">|</span>
				<div class="language-toggle">
					<button
						class="lang-option"
						class:active={$language === 'en'}
						onclick={() => {
							if ($language !== 'en') language.toggle();
						}}
					>
						EN
					</button>
					<span class="separator">|</span>
					<button
						class="lang-option"
						class:active={$language === 'pt'}
						onclick={() => {
							if ($language !== 'pt') language.toggle();
						}}
					>
						PT
					</button>
				</div>
			</div>
		</div>
	</header>
{/if}

{#if showModal}
	<div class="modal-backdrop" role="dialog" aria-modal="true" onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
		<div class="modal-card" onclick={(e) => e.stopPropagation()}>
			<button type="button" class="modal-close" aria-label="Close" onclick={closeModal}>&times;</button>
			{#if !showForgotPassword}
				<h2 class="modal-title">Log In</h2>
				<p class="modal-subtitle">Sign in to your account</p>
				{#if loginError}
					<div class="alert alert-error">{loginError}</div>
				{/if}
				<form class="auth-form" onsubmit={handleLoginSubmit}>
					<div class="form-group">
						<label for="modal-username">Username</label>
						<input name="username" id="modal-username" type="text" required />
					</div>
					<div class="form-group">
						<label for="modal-password">Password</label>
						<input name="password" id="modal-password" type="password" required />
					</div>
					<button type="submit" class="btn-primary" disabled={loginSubmitting}>{loginSubmitting ? 'Signing in…' : 'Sign In'}</button>
				</form>
				<div class="auth-links">
					<button type="button" class="link-button" onclick={() => { showForgotPassword = true; loginError = ''; }}>Forgot your password?</button>
				</div>
				<p class="auth-footer">
					Need an account? <a href="/register">Register</a>
				</p>
			{:else}
				<h2 class="modal-title">Reset Password</h2>
				<p class="modal-subtitle">Enter your email and we'll send you a password reset link.</p>
				{#if resetSuccess}
					<div class="alert alert-success">{resetSuccess}</div>
				{/if}
				{#if resetError}
					<div class="alert alert-error">{resetError}</div>
				{/if}
				<form class="auth-form" onsubmit={handleResetSubmit}>
					<div class="form-group">
						<label for="modal-email">Email</label>
						<input name="email" id="modal-email" type="email" required />
					</div>
					<button type="submit" class="btn-primary" disabled={resetSubmitting}>{resetSubmitting ? 'Sending…' : 'Send Reset Link'}</button>
				</form>
				<p class="auth-footer">
					<button type="button" class="link-button" onclick={() => { showForgotPassword = false; resetSuccess = ''; resetError = ''; }}>Back to login</button>
				</p>
			{/if}
		</div>
	</div>
{/if}

<main class:owner-dashboard-fullbleed={isOwnerDashboard}>
	<slot />
</main>

<footer class="footer">
	<div class="footer-container">
		<div class="footer-content">
			<div class="footer-logo">
				<img src="/logo.png" alt="TrakingTransfers" class="logo-image" />
			</div>
			
			<div class="footer-info">
				<p class="copyright">
					© {currentYear} TrakingTransfers.pt. {t.footer_all_rights_reserved}
				</p>
			</div>

			<div class="footer-reclamacoes">
				<a
					href="https://www.livroreclamacoes.pt"
					target="_blank"
					rel="noopener noreferrer"
					class="reclamacoes-link"
				>
					<img
						src="/livro_reclamacoes2.png"
						alt="Livro de Reclamações"
						class="reclamacoes-logo"
					/>
				</a>
			</div>
		</div>
	</div>
</footer>

<style>
	.header {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.75rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.header-link {
		color: #333;
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 500;
	}

	.header-link:hover {
		color: #007bff;
	}

	.logout-form-inline {
		margin: 0;
	}

	.header-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.9rem;
		border-radius: 5px;
		cursor: pointer;
		font-weight: 500;
		border: none;
		transition: background-color 0.2s, color 0.2s;
	}

	.header-btn-login {
		background: #007bff;
		color: white;
	}

	.header-btn-login:hover {
		background: #0056b3;
	}

	.header-btn-logout {
		background: #dc3545;
		color: white;
	}

	.header-btn-logout:hover {
		background: #c82333;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		position: relative;
	}

	.modal-close {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		color: #666;
		padding: 0.25rem;
	}

	.modal-close:hover {
		color: #333;
	}

	.modal-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a1a;
	}

	.modal-subtitle {
		margin: 0 0 1.5rem 0;
		color: #666;
		font-size: 0.9rem;
	}

	.modal-card .auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.modal-card .form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.modal-card .form-group label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #333;
	}

	.modal-card .form-group input {
		padding: 0.6rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
	}

	.modal-card .btn-primary {
		padding: 0.6rem 1.25rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
	}

	.modal-card .btn-primary:hover:not(:disabled) {
		background: #0056b3;
	}

	.modal-card .btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.modal-card .auth-links {
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.modal-card .link-button {
		background: none;
		border: none;
		color: #007bff;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
	}

	.modal-card .link-button:hover {
		text-decoration: underline;
	}

	.modal-card .auth-footer {
		margin: 0;
		padding-top: 1rem;
		border-top: 1px solid #eee;
		font-size: 0.9rem;
		color: #666;
	}

	.modal-card .auth-footer a {
		color: #007bff;
		text-decoration: none;
	}

	.modal-card .alert {
		padding: 0.6rem 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.modal-card .alert-error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.modal-card .alert-success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: #333;
		text-decoration: none;
		cursor: pointer;
		transition: color 0.2s;
	}

	.logo:hover {
		color: #007bff;
	}

	.language-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #666;
	}

	.lang-option {
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		color: #666;
		transition: color 0.2s;
		font-weight: 500;
	}

	.lang-option:hover {
		color: #333;
	}

	.lang-option.active {
		color: #007bff;
		font-weight: 600;
		cursor: default;
	}

	.separator {
		color: #ccc;
		font-weight: 300;
	}

	.footer {
		background: #fff;
		color: #1a1a1a;
		padding: 2rem 0;
		margin-top: 4rem;
		border-top: 1px solid #e0e0e0;
	}

	.footer-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.footer-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 2rem;
	}

	.footer-logo {
		flex-shrink: 0;
	}

	.logo-image {
		height: 120px;
		width: auto;
	}

	.footer-info {
		flex: 1;
		text-align: center;
	}

	.copyright {
		margin: 0;
		color: #1a1a1a;
		font-size: 0.9rem;
	}

	.footer-reclamacoes {
		flex-shrink: 0;
	}

	.reclamacoes-link {
		display: block;
		transition: opacity 0.2s;
	}

	.reclamacoes-link:hover {
		opacity: 0.8;
	}

	.reclamacoes-logo {
		height: 80px;
		width: auto;
	}

	.owner-dashboard-fullbleed {
		padding: 0;
		margin: 0;
		max-width: 100%;
	}

	@media (max-width: 768px) {
		.footer-content {
			flex-direction: column;
			text-align: center;
		}

		.footer-info {
			order: 2;
		}

		.footer-logo {
			order: 1;
		}

		.footer-reclamacoes {
			order: 3;
		}
	}
</style>

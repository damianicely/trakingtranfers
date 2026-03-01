<script lang="ts">
	import { language } from '$lib/stores/language';
	import { openLoginModal } from '$lib/stores/loginModal';

	let {
		scrolled = $bindable(false),
		user = null
	}: { scrolled?: boolean; user?: { username: string; role: string } | null } = $props();

	function toggleLanguage() {
		$language = $language === 'en' ? 'pt' : 'en';
	}

	function handleLogin() {
		openLoginModal.set(true);
	}
</script>

<nav class="nav" class:scrolled>
	<div class="nav-container">
		<a href="/" class="logo">Traking</a>
		<div class="nav-right">
			<div class="language-toggle">
				<button class:active={$language === 'en'} onclick={() => ($language = 'en')}>EN</button>
				<span>|</span>
				<button class:active={$language === 'pt'} onclick={() => ($language = 'pt')}>PT</button>
			</div>
			{#if user}
				<a href="/dashboard" class="login-btn">{$language === 'en' ? 'Dashboard' : 'Painel'}</a>
				<form method="POST" action="/logout" class="logout-form">
					<button type="submit" class="login-btn logout-btn"
						>{$language === 'en' ? 'Logout' : 'Sair'}</button
					>
				</form>
			{:else}
				<button class="login-btn" onclick={handleLogin}
					>{$language === 'en' ? 'Login' : 'Entrar'}</button
				>
			{/if}
			<button class="mobile-menu-btn" aria-label="Menu">
				<svg viewBox="0 0 24 24" fill="none" stroke-width="2">
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>
			</button>
		</div>
	</div>
</nav>

<style>
	@import '$lib/styles/new-landing.css';

	.logout-form {
		display: inline;
		margin: 0;
		padding: 0;
	}

	.logout-btn {
		background: transparent;
		border: 1px solid var(--color-white);
		color: var(--color-white);
		padding: 0.625rem 1.5rem;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: var(--transition);
		border-radius: 2px;
	}

	.nav.scrolled .logout-btn {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.logout-btn:hover {
		background: var(--color-white);
		color: var(--color-primary);
	}

	.nav.scrolled .logout-btn:hover {
		background: var(--color-primary);
		color: var(--color-white);
	}
</style>

<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { browser } from '$app/environment';

	onMount(() => {
		language.init();
	});

	const t = $derived(translations[$language]);
	const currentYear = new Date().getFullYear();
</script>

<header class="header">
	<div class="container">
		<a href="/" class="logo">TrakingTransfers.pt</a>
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
</header>

<main>
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

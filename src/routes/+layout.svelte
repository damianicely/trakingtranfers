<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { language } from '$lib/stores/language';
	import { browser } from '$app/environment';

	onMount(() => {
		language.init();
	});
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

</style>

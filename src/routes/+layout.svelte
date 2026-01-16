<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { language } from '$lib/stores/language';
	import { browser } from '$app/environment';

	let scrollY = 0;
	let headerOpacity = 0.95; // Starting opacity (opaque)

	onMount(() => {
		language.init();

		if (browser) {
			const handleScroll = () => {
				scrollY = window.scrollY;
			};

			// Throttle scroll events for better performance
			let ticking = false;
			const throttledScroll = () => {
				if (!ticking) {
					window.requestAnimationFrame(() => {
						handleScroll();
						ticking = false;
					});
					ticking = true;
				}
			};

			window.addEventListener('scroll', throttledScroll, { passive: true });
			
			return () => {
				window.removeEventListener('scroll', throttledScroll);
			};
		}
	});

	// Calculate opacity based on scroll position
	// Fade from 0.95 (opaque) to 0.1 (transparent) as user scrolls down
	// Adjust the 200 value to control fade speed (lower = faster fade)
	$: if (browser) {
		headerOpacity = Math.max(0.95 - (scrollY / 200), 0.1);
	}
</script>

<header class="header" style="--header-opacity: {headerOpacity}">
	<div class="container">
		<div class="logo">TrakingTransfers.pt</div>
		<button class="language-toggle" onclick={() => language.toggle()}>
			{$language === 'en' ? 'PT' : 'EN'}
		</button>
	</div>
</header>

<main>
	<slot />
</main>

<style>
	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		/* Background uses CSS variable for dynamic opacity */
		background: rgba(255, 255, 255, var(--header-opacity, 0.95));
		backdrop-filter: blur(10px);
		box-shadow: 0 2px 10px rgba(0, 0, 0, calc(var(--header-opacity, 0.95) * 0.5));
		transition: background 0.2s ease-out, box-shadow 0.2s ease-out;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: bold;
		color: #333;
	}

	.language-toggle {
		padding: 1rem 2rem;
		background: #007bff !important;
		color: white !important;
		border: 3px solid #0056b3 !important;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 700;
		font-size: 1.1rem;
		transition: all 0.3s;
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.5);
		min-width: 80px;
		display: block !important;
		visibility: visible !important;
		opacity: 1 !important;
	}

	.language-toggle:hover {
		background: #0056b3;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
	}

	.language-toggle:active {
		transform: translateY(0);
	}

	main {
		margin-top: 80px;
	}
</style>

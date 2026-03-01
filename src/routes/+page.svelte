<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import BookingSection from '$lib/components/landing/BookingSection.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import Trail from '$lib/components/landing/Trail.svelte';
	import Gallery from '$lib/components/landing/Gallery.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { translations, type Language } from '$lib/translations';
	import { language } from '$lib/stores/language';

	let { data } = $props();
	let scrolled = $state(false);

	const t = $derived((key: string) => {
		const currentLang = $language as Language;
		return translations[currentLang]?.[key as keyof typeof translations.en] || key;
	});

	onMount(() => {
		if (browser) {
			// Initialize language store
			language.init();

			// Scroll handler for nav
			const handleScroll = () => {
				scrolled = window.scrollY > 50;
			};

			window.addEventListener('scroll', handleScroll);
			handleScroll(); // Check initial state

			return () => {
				window.removeEventListener('scroll', handleScroll);
			};
		}
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="new-landing">
	<Nav {scrolled} user={data.user} />
	<Hero {t} />
	<BookingSection user={data.user} />
	<Features />
	<Trail />
	<Gallery />
	<Footer />
</div>

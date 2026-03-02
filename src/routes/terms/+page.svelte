<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';

	const t = $derived(translations[$language]);
	let scrolled = $state(false);

	const handleScroll = () => {
		scrolled = window.scrollY > 50;
	};
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>Terms & Conditions - TrakingTransfers</title>
	<meta
		name="description"
		content={$language === 'en'
			? 'Terms and conditions for using the TrakingTransfers luggage transport service.'
			: 'Termos e condições para utilização do serviço de transporte de bagagem TrakingTransfers.'}
	/>
</svelte:head>

<div class="content-page">
	<Nav {scrolled} user={null} />

	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-overlay"></div>
		<div class="hero-content">
			<h1 class="hero-title">{t.page_terms_title}</h1>
			<p class="hero-subtitle">{t.page_terms_subtitle}</p>
		</div>
	</section>

	<!-- Main Content -->
	<div class="content-container">
		<div class="terms-document">
			<section class="terms-section">
				<h2>{t.page_terms_section1_title}</h2>
				<p>{t.page_terms_section1_text}</p>
			</section>

			<section class="terms-section">
				<h2>{t.page_terms_section2_title}</h2>
				<p>{t.page_terms_section2_text}</p>
			</section>

			<section class="terms-section">
				<h2>{t.page_terms_section3_title}</h2>
				<p>{t.page_terms_section3_text}</p>
			</section>

			<section class="terms-section">
				<h2>{t.page_terms_section4_title}</h2>
				<p>{t.page_terms_section4_text}</p>
			</section>

			<section class="terms-section">
				<h2>{t.page_terms_section5_title}</h2>
				<p>{t.page_terms_section5_text}</p>
			</section>

			<section class="terms-section">
				<h2>{t.page_terms_section6_title}</h2>
				<p>{t.page_terms_section6_text}</p>
			</section>

			<section class="terms-section">
				<h2>{t.page_terms_section7_title}</h2>
				<p>{t.page_terms_section7_text}</p>
			</section>

			<section class="terms-section">
				<h2>{t.page_terms_section8_title}</h2>
				<p>{t.page_terms_section8_text}</p>
			</section>

			<div class="last-updated">
				<p>{$language === 'en' ? 'Last updated: March 2026' : 'Última atualização: Março 2026'}</p>
			</div>
		</div>
	</div>

	<Footer />
</div>

<style>
	@import '$lib/styles/new-landing.css';

	.content-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8f8f5 0%, #f0f0eb 100%);
	}

	/* Hero Section */
	.hero-section {
		position: relative;
		height: 35vh;
		min-height: 300px;
		background: linear-gradient(135deg, var(--color-primary) 0%, #2d2d2d 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: url('/images/jeffrey-eisen-Kd8cJ7kqf1c-unsplash.jpg') center/cover;
		opacity: 0.3;
	}

	.hero-content {
		position: relative;
		text-align: center;
		color: var(--color-white);
		padding: 0 2rem;
		z-index: 1;
	}

	.hero-title {
		font-family: var(--font-heading);
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 600;
		margin-bottom: 1rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.hero-subtitle {
		font-size: clamp(1.1rem, 2.5vw, 1.5rem);
		opacity: 0.9;
		max-width: 600px;
		margin: 0 auto;
	}

	/* Content Container */
	.content-container {
		max-width: 800px;
		margin: -3rem auto 4rem;
		padding: 0 2rem;
		position: relative;
		z-index: 2;
	}

	/* Terms Document */
	.terms-document {
		background: var(--color-white);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 3rem;
	}

	.terms-section {
		margin-bottom: 2.5rem;
	}

	.terms-section:last-of-type {
		margin-bottom: 0;
	}

	.terms-section h2 {
		font-family: var(--font-heading);
		font-size: 1.4rem;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0 0 1rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 2px solid var(--color-accent);
		display: inline-block;
	}

	.terms-section p {
		color: var(--color-text);
		font-size: 1.05rem;
		line-height: 1.8;
		margin: 0;
	}

	.last-updated {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
		text-align: center;
	}

	.last-updated p {
		color: var(--color-text-light);
		font-size: 0.9375rem;
		font-style: italic;
		margin: 0;
	}

	@media (max-width: 768px) {
		.hero-section {
			height: 30vh;
			min-height: 250px;
		}

		.content-container {
			margin-top: -2rem;
			padding: 0 1rem;
		}

		.terms-document {
			padding: 1.75rem;
		}

		.terms-section {
			margin-bottom: 2rem;
		}

		.terms-section h2 {
			font-size: 1.2rem;
		}

		.terms-section p {
			font-size: 1rem;
		}

		.last-updated {
			margin-top: 2rem;
			padding-top: 1.5rem;
		}
	}
</style>

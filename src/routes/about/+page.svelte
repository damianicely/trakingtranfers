<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';

	const t = $derived(translations[$language]);
	let scrolled = $state(false);

	// Scroll handler
	const handleScroll = () => {
		scrolled = window.scrollY > 50;
	};
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>About Us - TrakingTransfers</title>
	<meta
		name="description"
		content={$language === 'en'
			? 'Total specialisation in the Rota Vicentina. We are not just another transfer operator.'
			: 'Especialização total na Rota Vicentina. Não somos mais um operador de transfers.'}
	/>
</svelte:head>

<div class="content-page">
	<Nav {scrolled} user={null} />

	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-overlay"></div>
		<div class="hero-content">
			<h1 class="hero-title">{t.page_about_title}</h1>
			<p class="hero-subtitle">{t.page_about_subtitle}</p>
		</div>
	</section>

	<!-- Main Content -->
	<div class="content-container">
		<!-- Intro Section -->
		<section class="intro-section">
			<p class="intro-text">{t.page_about_intro}</p>
		</section>

		<!-- Specialization Section -->
		<section class="info-card">
			<div class="card-header">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2L2 7l10 5 10-5-10-5z"></path>
						<path d="M2 17l10 5 10-5"></path>
						<path d="M2 12l10 5 10-5"></path>
					</svg>
				</div>
				<h2>{t.page_about_specialization_title}</h2>
			</div>
			<div class="card-content">
				<ul class="feature-list">
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_specialization_point1}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_specialization_point2}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_specialization_point3}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_specialization_point4}</span>
					</li>
				</ul>
			</div>
		</section>

		<!-- Service Section -->
		<section class="info-card">
			<div class="card-header">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
						<path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
					</svg>
				</div>
				<h2>{t.page_about_service_title}</h2>
			</div>
			<div class="card-content">
				<ul class="feature-list">
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_service_point1}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_service_point2}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_service_point3}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_service_point4}</span>
					</li>
				</ul>
			</div>
		</section>

		<!-- Flexible Section -->
		<section class="info-card">
			<div class="card-header">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
				</div>
				<h2>{t.page_about_flexible_title}</h2>
			</div>
			<div class="card-content">
				<ul class="feature-list">
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_flexible_point1}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_flexible_point2}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_flexible_point3}</span>
					</li>
					<li>
						<svg
							class="check-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>{t.page_about_flexible_point4}</span>
					</li>
				</ul>
			</div>
		</section>
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
		height: 50vh;
		min-height: 400px;
		background: url('/images/christian-loch-KGQUvg024DM-unsplash.jpg') center/cover;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
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
		max-width: 900px;
		margin: -4rem auto 4rem;
		padding: 0 2rem;
		position: relative;
		z-index: 2;
	}

	/* Intro Section */
	.intro-section {
		text-align: center;
		margin-bottom: 3rem;
	}

	.intro-text {
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-primary);
		font-style: italic;
	}

	/* Info Cards */
	.info-card {
		background: var(--color-white);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		margin-bottom: 2rem;
		overflow: hidden;
	}

	.card-header {
		background: var(--color-secondary);
		padding: 1.5rem 2rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.card-icon {
		width: 48px;
		height: 48px;
		background: var(--color-accent);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-white);
		flex-shrink: 0;
	}

	.card-icon svg {
		width: 24px;
		height: 24px;
	}

	.card-header h2 {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0;
	}

	.card-content {
		padding: 2rem;
	}

	.feature-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.feature-list li {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.feature-list li:last-child {
		border-bottom: none;
	}

	.check-icon {
		width: 20px;
		height: 20px;
		color: var(--color-accent);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.feature-list span {
		font-size: 1.1rem;
		color: var(--color-text);
	}

	@media (max-width: 768px) {
		.hero-section {
			height: 40vh;
			min-height: 300px;
		}

		.content-container {
			margin-top: -2rem;
			padding: 0 1rem;
		}

		.intro-text {
			font-size: 1.2rem;
		}

		.card-header {
			padding: 1.25rem;
		}

		.card-header h2 {
			font-size: 1.25rem;
		}

		.card-content {
			padding: 1.5rem;
		}
	}
</style>

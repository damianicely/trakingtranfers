<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';

	const t = $derived(translations[$language]);
	let scrolled = $state(false);
	let formSubmitted = $state(false);

	const handleScroll = () => {
		scrolled = window.scrollY > 50;
	};

	const handleSubmit = (e: Event) => {
		e.preventDefault();
		formSubmitted = true;
		// In a real implementation, you'd send the form data to your backend
		setTimeout(() => {
			formSubmitted = false;
		}, 5000);
	};
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>Group Bookings - TrakingTransfers</title>
	<meta
		name="description"
		content={$language === 'en'
			? 'Complete solutions for groups on the Rota Vicentina. We take care of everything.'
			: 'Soluções completas para grupos na Rota Vicentina. Nós tratamos de tudo.'}
	/>
</svelte:head>

<div class="content-page">
	<Nav {scrolled} user={null} />

	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-overlay"></div>
		<div class="hero-content">
			<h1 class="hero-title">{t.page_group_title}</h1>
			<p class="hero-subtitle">{t.page_group_subtitle}</p>
		</div>
	</section>

	<!-- Main Content -->
	<div class="content-container">
		<!-- Intro -->
		<section class="intro-section">
			<p class="intro-text">{t.page_group_intro}</p>
		</section>

		<!-- Features Grid -->
		<section class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
					</svg>
				</div>
				<h3>{t.page_group_logistics_title}</h3>
				<p>{t.page_group_logistics_text}</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
						<polyline points="9 22 9 12 15 12 15 22"></polyline>
					</svg>
				</div>
				<h3>{t.page_group_accommodation_title}</h3>
				<p>{t.page_group_accommodation_text}</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
				</div>
				<h3>{t.page_group_flexible_title}</h3>
				<p>{t.page_group_flexible_text}</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path
							d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
						></path>
					</svg>
				</div>
				<h3>{t.page_group_support_title}</h3>
				<p>{t.page_group_support_text}</p>
			</div>
		</section>

		<!-- Contact Form Section -->
		<section class="form-section">
			<div class="form-layout">
				<div class="form-title-side">
					<h2 class="form-title">{t.page_group_cta_title}</h2>
				</div>
				<div class="booking-form-container">
					{#if formSubmitted}
						<div class="success-message">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
								<polyline points="22 4 12 14.01 9 11.01"></polyline>
							</svg>
							<span
								>{$language === 'en'
									? 'Thank you! We will contact you soon.'
									: 'Obrigado! Entraremos em contacto brevemente.'}</span
							>
						</div>
					{:else}
						<form onsubmit={handleSubmit} class="contact-form">
							<div class="form-grid">
								<div class="form-group">
									<label for="name">{t.page_group_form_name}</label>
									<input type="text" id="name" name="name" required />
								</div>
								<div class="form-group">
									<label for="email">{t.page_group_form_email}</label>
									<input type="email" id="email" name="email" required />
								</div>
								<div class="form-group">
									<label for="phone">{t.page_group_form_phone}</label>
									<input type="tel" id="phone" name="phone" />
								</div>
								<div class="form-group">
									<label for="groupSize">{t.page_group_form_group_size}</label>
									<input type="number" id="groupSize" name="groupSize" min="1" />
								</div>
							</div>

							<div class="form-group full-width">
								<label for="dates">{t.page_group_form_dates}</label>
								<input
									type="text"
									id="dates"
									name="dates"
									placeholder={$language === 'en'
										? 'e.g., 15-20 June 2026'
										: 'ex: 15-20 Junho 2026'}
								/>
							</div>

							<div class="form-group full-width">
								<label for="message">{t.page_group_form_message}</label>
								<textarea id="message" name="message" rows="4"></textarea>
							</div>

							<button type="submit" class="submit-btn">{t.page_group_form_submit}</button>
						</form>
					{/if}
				</div>
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
		background: url('/images/tobias-kaiser-bAkZ9vzdLpk-unsplash.jpg') center/cover;
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
		max-width: 700px;
		margin: 0 auto;
	}

	/* Content Container */
	.content-container {
		max-width: 1100px;
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
		font-size: 1.4rem;
		font-weight: 500;
		color: var(--color-primary);
		font-style: italic;
	}

	/* Features Grid */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.feature-card {
		background: var(--color-white);
		border-radius: var(--radius);
		padding: 2rem;
		box-shadow: var(--shadow);
		transition: all 0.3s ease;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.feature-icon {
		width: 56px;
		height: 56px;
		background: var(--color-accent);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-white);
		margin-bottom: 1.25rem;
	}

	.feature-icon svg {
		width: 28px;
		height: 28px;
		stroke: var(--color-white);
	}

	.feature-card h3 {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0 0 0.75rem 0;
	}

	.feature-card p {
		color: var(--color-text);
		font-size: 1rem;
		line-height: 1.6;
		margin: 0;
	}

	/* Form Section - Styled like booking form */
	.form-section {
		margin-top: 3rem;
	}

	.form-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: center;
		min-height: 500px;
	}

	.form-title-side {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.form-title {
		font-size: 2rem;
		color: var(--color-primary);
		text-align: center;
		font-family: var(--font-heading);
		font-weight: 600;
		line-height: 1.3;
		max-width: 400px;
	}

	.booking-form-container {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.contact-form {
		width: 100%;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #333;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #ddd;
		border-radius: 2px;
		font-family: inherit;
		font-size: 0.9375rem;
		color: #1a1a1a;
		background: white;
		transition: all 0.3s ease;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #1a1a1a;
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: #999;
	}

	.submit-btn {
		width: 100%;
		padding: 1rem 2rem;
		background: #1a1a1a;
		color: white;
		border: none;
		border-radius: 2px;
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-top: 1rem;
	}

	.submit-btn:hover {
		background: #c4a77d;
	}

	/* Success Message */
	.success-message {
		padding: 3rem 2rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		color: #22c55e;
	}

	.success-message svg {
		width: 64px;
		height: 64px;
		stroke: #22c55e;
	}

	.success-message span {
		font-size: 1.2rem;
		font-weight: 500;
		color: var(--color-primary);
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

		.features-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-layout {
			grid-template-columns: 1fr;
			gap: 2rem;
			min-height: auto;
		}

		.form-title-side {
			order: -1;
		}

		.booking-form-container {
			padding: 1.5rem;
		}

		.form-title {
			font-size: 1.5rem;
		}
	}
</style>

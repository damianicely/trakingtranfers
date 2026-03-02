<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import Nav from '$lib/components/landing/Nav.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';

	const t = $derived(translations[$language]);
	let scrolled = $state(false);
	let expandedQuestions = $state<Record<string, boolean>>({});

	const handleScroll = () => {
		scrolled = window.scrollY > 50;
	};

	const toggleQuestion = (key: string) => {
		expandedQuestions = { ...expandedQuestions, [key]: !expandedQuestions[key] };
	};

	const faqItems = [
		{ key: 'q1', question: 'page_faq_q1_question', answer: 'page_faq_q1_answer' },
		{ key: 'q2', question: 'page_faq_q2_question', answer: 'page_faq_q2_answer' },
		{ key: 'q3', question: 'page_faq_q3_question', answer: 'page_faq_q3_answer' },
		{ key: 'q4', question: 'page_faq_q4_question', answer: 'page_faq_q4_answer' },
		{ key: 'q5', question: 'page_faq_q5_question', answer: 'page_faq_q5_answer' },
		{ key: 'q6', question: 'page_faq_q6_question', answer: 'page_faq_q6_answer' }
	];
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>FAQ - TrakingTransfers</title>
	<meta
		name="description"
		content={$language === 'en'
			? 'Frequently asked questions about our luggage transfer service on the Rota Vicentina.'
			: 'Perguntas frequentes sobre o nosso serviço de transferência de bagagem na Rota Vicentina.'}
	/>
</svelte:head>

<div class="content-page">
	<Nav {scrolled} user={null} />

	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-overlay"></div>
		<div class="hero-content">
			<h1 class="hero-title">{t.page_faq_title}</h1>
			<p class="hero-subtitle">{t.page_faq_subtitle}</p>
		</div>
	</section>

	<!-- Main Content -->
	<div class="content-container">
		<section class="faq-section">
			{#each faqItems as item}
				<div class="faq-card" class:expanded={expandedQuestions[item.key]}>
					<button
						class="faq-question"
						onclick={() => toggleQuestion(item.key)}
						aria-expanded={expandedQuestions[item.key]}
					>
						<span class="question-number">{item.key.replace('q', '')}</span>
						<span class="question-text">{t[item.question]}</span>
						<span class="question-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								{#if expandedQuestions[item.key]}
									<line x1="5" y1="12" x2="19" y2="12"></line>
								{:else}
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<line x1="5" y1="12" x2="19" y2="12"></line>
								{/if}
							</svg>
						</span>
					</button>
					{#if expandedQuestions[item.key]}
						<div class="faq-answer" transition:slide>
							<p>{t[item.answer]}</p>
						</div>
					{/if}
				</div>
			{/each}
		</section>

		<!-- Contact CTA -->
		<section class="cta-section">
			<div class="cta-card">
				<h3>{$language === 'en' ? 'Still have questions?' : 'Ainda tem dúvidas?'}</h3>
				<p>
					{$language === 'en'
						? 'Contact us and we will be happy to help.'
						: 'Contacte-nos e teremos todo o gosto em ajudar.'}
				</p>
				<a href="mailto:info@trakingtransfers.com" class="cta-btn">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
						></path>
						<polyline points="22,6 12,13 2,6"></polyline>
					</svg>
					info@trakingtransfers.com
				</a>
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
		height: 40vh;
		min-height: 350px;
		background: url('/images/leon-rohrwild-NGNdEZDadm8-unsplash.jpg') center/cover;
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
		margin: -3rem auto 4rem;
		padding: 0 2rem;
		position: relative;
		z-index: 2;
	}

	/* FAQ Section */
	.faq-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.faq-card {
		background: var(--color-white);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
		transition: all 0.3s ease;
	}

	.faq-card:hover {
		box-shadow: var(--shadow-lg);
	}

	.faq-card.expanded {
		box-shadow: var(--shadow-lg);
	}

	.faq-question {
		width: 100%;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.faq-question:hover {
		background: var(--color-secondary);
	}

	.question-number {
		width: 40px;
		height: 40px;
		background: var(--color-accent);
		color: var(--color-white);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
		flex-shrink: 0;
	}

	.question-text {
		flex: 1;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.question-icon {
		width: 24px;
		height: 24px;
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.question-icon svg {
		width: 100%;
		height: 100%;
	}

	.faq-answer {
		padding: 0 1.5rem 1.5rem 5rem;
		animation: slideDown 0.3s ease;
	}

	.faq-answer p {
		color: var(--color-text);
		font-size: 1rem;
		line-height: 1.7;
		margin: 0;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* CTA Section */
	.cta-section {
		margin-top: 2rem;
	}

	.cta-card {
		background: var(--color-secondary);
		border-radius: var(--radius);
		padding: 2.5rem;
		text-align: center;
	}

	.cta-card h3 {
		font-family: var(--font-heading);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-primary);
		margin: 0 0 0.75rem 0;
	}

	.cta-card p {
		color: var(--color-text);
		font-size: 1.1rem;
		margin: 0 0 1.5rem 0;
	}

	.cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 2rem;
		background: var(--color-accent);
		color: var(--color-white);
		text-decoration: none;
		border-radius: 8px;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.cta-btn:hover {
		background: var(--color-accent-dark);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(196, 167, 125, 0.3);
	}

	.cta-btn svg {
		width: 20px;
		height: 20px;
	}

	@media (max-width: 768px) {
		.hero-section {
			height: 35vh;
			min-height: 280px;
		}

		.content-container {
			margin-top: -2rem;
			padding: 0 1rem;
		}

		.faq-question {
			padding: 1.25rem;
		}

		.question-number {
			width: 32px;
			height: 32px;
			font-size: 0.9rem;
		}

		.question-text {
			font-size: 1rem;
		}

		.faq-answer {
			padding: 0 1.25rem 1.25rem 4rem;
		}

		.cta-card {
			padding: 1.75rem;
		}
	}
</style>

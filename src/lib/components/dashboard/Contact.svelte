<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	const t = $derived(translations[$language]);
</script>

<div class="contact-page">
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.dashboard_nav_contact}</h1>
	</div>

	<!-- Contact Content -->
	<div class="contact-container">
		<div class="contact-card">
			<h2>Get in Touch</h2>
			<p class="contact-description">
				Have questions about your booking or need assistance? We're here to help!
			</p>

			<div class="social-links">
				<a
					href="https://instagram.com/trakingtransfers"
					target="_blank"
					rel="noopener noreferrer"
					class="social-link"
				>
					<svg
						class="social-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
						<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
						<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
					</svg>
					<span>Instagram</span>
				</a>

				<a
					href="https://facebook.com/trakingtransfers"
					target="_blank"
					rel="noopener noreferrer"
					class="social-link"
				>
					<svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
						<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
					</svg>
					<span>Facebook</span>
				</a>
			</div>

			<div class="contact-info">
				<div class="info-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
						></path>
						<polyline points="22,6 12,13 2,6"></polyline>
					</svg>
					<span>info@trakingtransfers.com</span>
				</div>
				<div class="info-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path
							d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
						></path>
					</svg>
					<span>+351 123 456 789</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.contact-page {
		width: 100%;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-family: var(--font-heading, 'Playfair Display', serif);
		font-size: 2rem;
		font-weight: 500;
		color: var(--color-primary, #1a1a1a);
		margin: 0;
	}

	.contact-container {
		max-width: 600px;
	}

	.contact-card {
		background: #ffffff;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		text-align: center;
	}

	.contact-card h2 {
		font-family: var(--font-heading, 'Playfair Display', serif);
		font-size: 1.5rem;
		font-weight: 500;
		color: var(--color-primary, #1a1a1a);
		margin: 0 0 1rem 0;
	}

	.contact-description {
		color: var(--color-text-light, #666666);
		margin-bottom: 2rem;
		font-size: 1rem;
		line-height: 1.6;
	}

	.social-links {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.social-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-secondary, #f5f5f0);
		border-radius: 8px;
		color: var(--color-primary, #1a1a1a);
		text-decoration: none;
		font-weight: 500;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.social-link:hover {
		background: var(--color-accent, #c4a77d);
		color: #ffffff;
		transform: translateY(-2px);
	}

	.social-icon {
		width: 20px;
		height: 20px;
	}

	.contact-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-border, #e0e0e0);
	}

	.info-item {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: var(--color-text, #333333);
		font-size: 0.9375rem;
	}

	.info-item svg {
		width: 18px;
		height: 18px;
		color: var(--color-accent, #c4a77d);
	}

	@media (max-width: 640px) {
		.contact-card {
			padding: 1.5rem;
		}

		.social-links {
			flex-direction: column;
		}

		.social-link {
			justify-content: center;
		}
	}
</style>

<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	const t = $derived(translations[$language]);
</script>

<div class="track-page">
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.dashboard_nav_track}</h1>
	</div>

	<!-- Coming Soon Content -->
	<div class="coming-soon-container">
		<div class="coming-soon-card">
			<div class="icon-wrapper">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
					<circle cx="12" cy="10" r="3"></circle>
				</svg>
			</div>
			<h2>Coming Soon</h2>
			<p>
				Track your luggage in real-time! This feature is currently under development and will be
				available soon.
			</p>
			<div class="feature-list">
				<div class="feature-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					<span>Real-time location tracking</span>
				</div>
				<div class="feature-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					<span>Delivery notifications</span>
				</div>
				<div class="feature-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					<span>Transfer history</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.track-page {
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

	.coming-soon-container {
		max-width: 600px;
	}

	.coming-soon-card {
		background: #ffffff;
		border-radius: 12px;
		padding: 3rem 2rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		text-align: center;
	}

	.icon-wrapper {
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		background: rgba(196, 167, 125, 0.15);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-wrapper svg {
		width: 40px;
		height: 40px;
		color: var(--color-accent, #c4a77d);
	}

	.coming-soon-card h2 {
		font-family: var(--font-heading, 'Playfair Display', serif);
		font-size: 1.75rem;
		font-weight: 500;
		color: var(--color-primary, #1a1a1a);
		margin: 0 0 1rem 0;
	}

	.coming-soon-card p {
		color: var(--color-text-light, #666666);
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 2rem;
	}

	.feature-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 300px;
		margin: 0 auto;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: var(--color-secondary, #f5f5f0);
		border-radius: 8px;
		color: var(--color-text, #333333);
		font-size: 0.9375rem;
	}

	.feature-item svg {
		width: 18px;
		height: 18px;
		color: var(--color-success, #22c55e);
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.coming-soon-card {
			padding: 2rem 1.5rem;
		}
	}
</style>

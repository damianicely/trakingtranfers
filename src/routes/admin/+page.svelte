<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import DailySalesChart from '$lib/components/dashboard/owner/DailySalesChart.svelte';

	let { data } = $props();

	const t = $derived(translations[$language]);

	type DailySale = { date: string; amount: number; count: number };
	const daily = $derived((data.dailySales ?? []) as DailySale[]);

	const totalRevenue = $derived(daily.reduce((sum: number, day: DailySale) => sum + day.amount, 0));
	const totalBookings = $derived(daily.reduce((sum: number, day: DailySale) => sum + day.count, 0));
	const averageDailyRevenue = $derived(daily.length > 0 ? totalRevenue / daily.length : 0);
	const todaySales = $derived.by(() => {
		const today = new Date().toISOString().split('T')[0];
		const found = daily.find((d: DailySale) => d.date === today);
		return found ?? { amount: 0, count: 0 };
	});
</script>

<div class="admin-home">
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.admin_nav_overview}</h1>
	</div>

	<!-- Stats Grid -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon icon-primary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="1" x2="12" y2="23"></line>
					<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
				</svg>
			</div>
			<div class="stat-content">
				<div class="stat-label">{t.dashboard_owner_total_revenue}</div>
				<div class="stat-value">€{totalRevenue.toFixed(2)}</div>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon icon-success">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
					<polyline points="10 9 9 9 8 9"></polyline>
				</svg>
			</div>
			<div class="stat-content">
				<div class="stat-label">{t.dashboard_owner_total_bookings}</div>
				<div class="stat-value">{totalBookings}</div>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon icon-accent">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
					<polyline points="17 6 23 6 23 12"></polyline>
				</svg>
			</div>
			<div class="stat-content">
				<div class="stat-label">{t.dashboard_owner_avg_daily}</div>
				<div class="stat-value">€{averageDailyRevenue.toFixed(2)}</div>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon icon-warning">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
					<line x1="16" y1="2" x2="16" y2="6"></line>
					<line x1="8" y1="2" x2="8" y2="6"></line>
					<line x1="3" y1="10" x2="21" y2="10"></line>
				</svg>
			</div>
			<div class="stat-content">
				<div class="stat-label">{t.dashboard_owner_today_sales}</div>
				<div class="stat-value">€{todaySales.amount.toFixed(2)}</div>
				<div class="stat-subtext">{todaySales.count} {t.dashboard_owner_bookings_today}</div>
			</div>
		</div>
	</div>

	<!-- Chart Section -->
	<section class="content-section">
		<div class="data-table-container">
			<div class="section-header">
				<div>
					<h2 class="section-title">{t.dashboard_owner_daily_sales_title}</h2>
					<p class="section-desc">{t.dashboard_owner_daily_sales_description}</p>
				</div>
			</div>
			<div class="chart-container">
				{#if daily.length > 0}
					<DailySalesChart dailySales={daily} />
				{:else}
					<div class="empty-state">{t.dashboard_owner_no_sales_data}</div>
				{/if}
			</div>
		</div>
	</section>
</div>

<style>
	.admin-home {
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

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #ffffff;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.stat-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stat-icon svg {
		width: 24px;
		height: 24px;
	}

	.icon-primary {
		background: rgba(26, 26, 26, 0.08);
		color: var(--color-primary, #1a1a1a);
	}

	.icon-success {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.icon-accent {
		background: rgba(196, 167, 125, 0.15);
		color: var(--color-accent, #c4a77d);
	}

	.icon-warning {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color-text-light, #666666);
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		letter-spacing: -0.01em;
	}

	.stat-subtext {
		font-size: 0.8125rem;
		color: var(--color-text-light, #666666);
		margin-top: 0.25rem;
	}

	/* Content Section */
	.content-section {
		margin-bottom: 2rem;
	}

	.data-table-container {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.section-header {
		padding: 1.5rem 1.5rem 0;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		margin: 0 0 0.25rem 0;
	}

	.section-desc {
		font-size: 0.9375rem;
		color: var(--color-text-light, #666666);
		margin: 0;
	}

	.chart-container {
		padding: 1.5rem;
		overflow-x: auto;
	}

	.empty-state {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-light, #666666);
		font-style: italic;
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

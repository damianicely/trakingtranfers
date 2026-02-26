<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import DailySalesChart from '$lib/components/dashboard/owner/DailySalesChart.svelte';

	let { data } = $props();

	const t = $derived(translations[$language]);

	type DailySale = { date: string; amount: number; count: number };
	const daily = $derived((data.dailySales ?? []) as DailySale[]);
	const ownerBookings = $derived(data.ownerBookings ?? []);

	const totalRevenue = $derived(daily.reduce((sum: number, day: DailySale) => sum + day.amount, 0));
	const totalBookings = $derived(daily.reduce((sum: number, day: DailySale) => sum + day.count, 0));
	const averageDailyRevenue = $derived(daily.length > 0 ? totalRevenue / daily.length : 0);
	const todaySales = $derived.by(() => {
		const today = new Date().toISOString().split('T')[0];
		const found = daily.find((d: DailySale) => d.date === today);
		return found ?? { amount: 0, count: 0 };
	});

	const recentBookings = $derived(ownerBookings.slice(0, 10));
</script>

<div class="admin-home">
	<header class="page-header">
		<h1 class="page-title">{t.dashboard_section_owner_overview_title ?? 'Overview'}</h1>
		<p class="page-subtitle">{t.dashboard_section_owner_overview_description ?? 'Business overview'}</p>
	</header>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-label">{t.dashboard_owner_total_revenue}</div>
			<div class="stat-value">€{totalRevenue.toFixed(2)}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">{t.dashboard_owner_total_bookings}</div>
			<div class="stat-value">{totalBookings}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">{t.dashboard_owner_avg_daily}</div>
			<div class="stat-value">€{averageDailyRevenue.toFixed(2)}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">{t.dashboard_owner_today_sales}</div>
			<div class="stat-value">€{todaySales.amount.toFixed(2)}</div>
			<div class="stat-subtext">{todaySales.count} {t.dashboard_owner_bookings_today}</div>
		</div>
	</div>

	<section class="content-section">
		<h2 class="section-title">{t.dashboard_owner_daily_sales_title}</h2>
		<p class="section-desc">{t.dashboard_owner_daily_sales_description}</p>
		<div class="table-wrapper chart-wrapper">
			{#if daily.length > 0}
				<DailySalesChart dailySales={daily} />
			{:else}
				<div class="empty-state">{t.dashboard_owner_no_sales_data}</div>
			{/if}
		</div>
	</section>

	<section class="content-section">
		<h2 class="section-title">{t.dashboard_section_owner_bookings_title}</h2>
		<p class="section-desc">{t.dashboard_section_owner_bookings_description}</p>
		<div class="table-wrapper">
			{#if recentBookings.length === 0}
				<div class="empty-state">{t.dashboard_owner_no_bookings}</div>
			{:else}
				<div class="bookings-list">
					{#each recentBookings as booking}
						<div class="booking-row">
							<div class="booking-info">
								<div class="booking-customer">
									{(booking.userFirstName ?? booking.firstName) || ''} {(booking.userLastName ?? booking.lastName) || ''}
									{#if !(booking.userFirstName ?? booking.firstName) && !(booking.userLastName ?? booking.lastName)}
										<span class="muted">—</span>
									{/if}
								</div>
								<div class="booking-date">
									{new Date(booking.createdAt || '').toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})}
								</div>
							</div>
							<div class="booking-amount">€{booking.totalPrice || '0'}</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.admin-home {
		max-width: 960px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 600;
		color: #1a1d21;
		letter-spacing: -0.02em;
		margin: 0 0 0.25rem 0;
	}

	.page-subtitle {
		font-size: 0.9375rem;
		color: #5f6368;
		margin: 0;
		font-weight: 500;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.25rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #fff;
		border-radius: 10px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(0, 0, 0, 0.04);
	}

	.stat-label {
		font-size: 0.875rem;
		color: #5f6368;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1d21;
		letter-spacing: -0.01em;
	}

	.stat-subtext {
		font-size: 0.75rem;
		color: #5f6368;
		margin-top: 0.25rem;
	}

	.content-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1d21;
		margin: 0 0 0.25rem 0;
		letter-spacing: -0.01em;
	}

	.section-desc {
		font-size: 0.9375rem;
		color: #5f6368;
		margin: 0 0 1rem 0;
	}

	.table-wrapper {
		background: #fff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.chart-wrapper {
		padding: 1.25rem;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #5f6368;
		font-style: italic;
		font-size: 0.9375rem;
	}

	.bookings-list {
		display: flex;
		flex-direction: column;
	}

	.booking-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.875rem 1.25rem;
		border-bottom: 1px solid #f0f1f3;
		transition: background 0.15s;
	}

	.booking-row:last-child {
		border-bottom: none;
	}

	.booking-row:hover {
		background: #fafbfc;
	}

	.booking-info {
		flex: 1;
		min-width: 0;
	}

	.booking-customer {
		font-weight: 500;
		color: #1a1d21;
		margin-bottom: 0.25rem;
	}

	.booking-date {
		font-size: 0.8125rem;
		color: #5f6368;
	}

	.booking-amount {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1d21;
		flex-shrink: 0;
		margin-left: 1rem;
	}

	.muted {
		color: #5f6368;
		font-style: italic;
		font-weight: 400;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

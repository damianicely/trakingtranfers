<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import AccountInfo from './AccountInfo.svelte';
	import DailySalesChart from './owner/DailySalesChart.svelte';

	let { user, data } = $props<{
		user: { username: string; id: string; role: string };
		data: {
			ownerBookings: Array<any>;
			dailySales: Array<{ date: string; amount: number; count: number }>;
		};
	}>();

	const t = $derived(translations[$language]);

	// Calculate summary statistics
	const totalRevenue = $derived(
		data.dailySales.reduce((sum, day) => sum + day.amount, 0)
	);
	const totalBookings = $derived(
		data.dailySales.reduce((sum, day) => sum + day.count, 0)
	);
	const averageDailyRevenue = $derived(
		data.dailySales.length > 0 ? totalRevenue / data.dailySales.length : 0
	);
	const todaySales = $derived.by(() => {
		const today = new Date().toISOString().split('T')[0];
		const todayData = data.dailySales.find((d) => d.date === today);
		return todayData || { amount: 0, count: 0 };
	});
</script>

<div class="owner-dashboard">
	<!-- Summary Cards -->
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

	<!-- Daily Sales Chart -->
	<section class="dashboard-section">
		<h2>{t.dashboard_owner_daily_sales_title}</h2>
		<p>{t.dashboard_owner_daily_sales_description}</p>
		{#if data.dailySales.length > 0}
			<DailySalesChart dailySales={data.dailySales} />
		{:else}
			<div class="empty-state">
				<p>{t.dashboard_owner_no_sales_data}</p>
			</div>
		{/if}
	</section>

	<!-- Recent Bookings -->
	<section class="dashboard-section">
		<h2>{t.dashboard_section_owner_bookings_title}</h2>
		<p>{t.dashboard_section_owner_bookings_description}</p>
		{#if data.ownerBookings.length === 0}
			<div class="empty-state">
				<p>{t.dashboard_owner_no_bookings}</p>
			</div>
		{:else}
			<div class="bookings-list">
				{#each data.ownerBookings.slice(0, 10) as booking}
					<div class="booking-item">
						<div class="booking-info">
							<div class="booking-customer">
								{booking.firstName || ''} {booking.lastName || ''}
								{#if !booking.firstName && !booking.lastName}
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
	</section>

	<AccountInfo {user} roleLabel={t.dashboard_role_owner} />
</div>

<style>
	.owner-dashboard {
		width: 100%;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.stat-label {
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: #1a1a1a;
	}

	.stat-subtext {
		font-size: 0.75rem;
		color: #999;
		margin-top: 0.25rem;
	}

	.dashboard-section {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.dashboard-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dashboard-section > p {
		margin: 0 0 1.5rem 0;
		color: #666;
		font-size: 0.9rem;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		background: white;
		border-radius: 4px;
		color: #999;
		font-style: italic;
	}

	.bookings-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.booking-item {
		background: white;
		padding: 1rem;
		border-radius: 6px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.booking-info {
		flex: 1;
	}

	.booking-customer {
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 0.25rem;
	}

	.booking-date {
		font-size: 0.85rem;
		color: #666;
	}

	.booking-amount {
		font-size: 1.1rem;
		font-weight: 600;
		color: #28a745;
	}

	.muted {
		color: #999;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, type Stage } from '$lib/trail';

	let { data, form } = $props();

	const t = $derived(translations[$language]);

	const stageNames = Object.fromEntries((STAGES as Stage[]).map((s) => [s.id, s.name]));

	const bag = $derived(data.bag);
	const segments = $derived(data.segments);
	const currentIndex = $derived(data.currentIndex);

	const current = $derived(currentIndex >= 0 ? segments[currentIndex] : null);
</script>

<div class="driver-bag-page">
	<h1 class="title">
		{t.dashboard_driver_bag_title || 'Bag details'}
	</h1>
	<p class="subtitle">
		{t.dashboard_driver_bag_subtitle || 'Booking'} #{bag.bookingShortRef} — Bag {bag.label}
	</p>

	{#if form?.message}
		<div class="status-message">
			{form.message}
		</div>
	{/if}

	{#if !current}
		<p class="all-done">
			{t.dashboard_driver_bag_all_done || 'All legs for this bag have been delivered.'}
		</p>
	{:else}
		<section class="current-leg">
			<h2>{t.dashboard_driver_bag_current_leg || 'Current leg'}</h2>
			<p class="leg-summary">
				<span class="date">{current.date}</span>
				<span class="route">
					{stageNames[current.fromStageId] || current.fromStageId}
					→
					{stageNames[current.toStageId] || current.toStageId}
				</span>
			</p>
			<p class="hotels">
				<span>
					<strong>{t.dashboard_driver_bag_start_hotel || 'Start hotel'}:</strong>
					{current.startHotelName}
				</span>
				<span>
					<strong>{t.dashboard_driver_bag_end_hotel || 'End hotel'}:</strong>
					{current.endHotelName}
				</span>
			</p>

			{#if current.status === 'at_hotel'}
				<form method="POST" action="?/pickUp" class="action-form">
					<input type="hidden" name="bagId" value={bag.id} />
					<input type="hidden" name="segmentId" value={current.segmentId} />
					<button type="submit" class="primary-button">
						{t.dashboard_driver_bag_pick_up || 'Mark as picked up'}
					</button>
				</form>
			{:else if current.status === 'with_driver'}
				<form method="POST" action="?/deliver" class="action-form">
					<input type="hidden" name="bagId" value={bag.id} />
					<input type="hidden" name="segmentId" value={current.segmentId} />
					<button type="submit" class="primary-button">
						{t.dashboard_driver_bag_deliver || 'Mark as delivered'}
					</button>
				</form>
			{:else}
				<p class="all-done">
					{t.dashboard_driver_bag_all_done || 'All legs for this bag have been delivered.'}
				</p>
			{/if}
		</section>

		<section class="leg-list">
			<h2>{t.dashboard_driver_bag_all_legs || 'All legs for this bag'}</h2>
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>{t.dashboard_driver_bag_date || 'Date'}</th>
						<th>{t.dashboard_driver_bag_route || 'Route'}</th>
						<th>{t.dashboard_driver_bag_status || 'Status'}</th>
					</tr>
				</thead>
				<tbody>
					{#each segments as s, i}
						<tr class:current-row={i === currentIndex}>
							<td>{i + 1}</td>
							<td>{s.date}</td>
							<td>
								{stageNames[s.fromStageId] || s.fromStageId}
								→
								{stageNames[s.toStageId] || s.toStageId}
							</td>
							<td>
								{s.status === 'at_hotel'
									? t.dashboard_driver_bag_status_at_hotel || 'At hotel'
									: s.status === 'with_driver'
									? t.dashboard_driver_bag_status_with_driver || 'With driver'
									: t.dashboard_driver_bag_status_delivered || 'Delivered'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
</div>

<style>
	.driver-bag-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.title {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.subtitle {
		margin: 0 0 1rem 0;
		color: #666;
	}

	.status-message {
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		background: #fff3cd;
		border-radius: 4px;
		color: #856404;
		font-size: 0.9rem;
	}

	.current-leg {
		background: #f9f9f9;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.leg-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: baseline;
		margin: 0 0 0.5rem 0;
	}

	.leg-summary .date {
		font-weight: 600;
	}

	.leg-summary .route {
		color: #333;
	}

	.hotels {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0.5rem 0 0.75rem 0;
		font-size: 0.9rem;
	}

	.action-form {
		margin-top: 0.5rem;
	}

	.primary-button {
		background: #0d6efd;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.primary-button:hover {
		background: #0b5ed7;
	}

	.leg-list table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.leg-list th,
	.leg-list td {
		border-bottom: 1px solid #e0e0e0;
		padding: 0.5rem 0.25rem;
		text-align: left;
	}

	.current-row {
		background: #e8f0ff;
		font-weight: 500;
	}

	.all-done {
		margin-top: 0.75rem;
		color: #2e7d32;
	}
</style>


<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { getStepLabel } from '$lib/delivery-steps';
	import { STAGES } from '$lib/trail';
	import type { LegSummaryForDate } from '$lib/server/driver-assignment/calendar-summary';

	type Driver = { id: string; username: string; firstName: string | null; lastName: string | null };

	let { selectedDate, legSummaries, drivers, driverAssignments } = $props<{
		selectedDate: string;
		legSummaries: LegSummaryForDate[];
		drivers: Driver[];
		driverAssignments: Record<string, string[]>;
	}>();

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (Number.isNaN(d.getTime())) return dateStr;
		return d.toLocaleDateString('en-GB', {
			year: 'numeric',
			month: 'short',
			day: '2-digit'
		});
	}

	function driverLabel(d: Driver): string {
		if (d.firstName || d.lastName) return [d.firstName, d.lastName].filter(Boolean).join(' ').trim();
		return d.username;
	}

	const stageOrder = $derived(STAGES.map((s) => s.id));

	type DirectionGroup = 'northbound' | 'southbound' | 'unknown';

	function classifyDirection(fromId: string, toId: string): DirectionGroup {
		const fromIdx = stageOrder.indexOf(fromId);
		const toIdx = stageOrder.indexOf(toId);
		if (fromIdx === -1 || toIdx === -1) return 'unknown';
		if (fromIdx > toIdx) return 'northbound';
		if (fromIdx < toIdx) return 'southbound';
		return 'unknown';
	}

	const groupedByDirection = $derived.by(() => {
		const groups: {
			northbound: Record<string, LegSummaryForDate[]>;
			southbound: Record<string, LegSummaryForDate[]>;
		} = { northbound: {}, southbound: {} };

		for (const summary of legSummaries ?? []) {
			const dir = classifyDirection(summary.fromStageId, summary.toStageId);
			if (dir === 'unknown') continue;
			const key = `${summary.fromStageId}-${summary.toStageId}`;
			const bucket = dir === 'northbound' ? groups.northbound : groups.southbound;
			if (!bucket[key]) bucket[key] = [];
			bucket[key].push(summary);
		}

		return groups;
	});

	let toggling = $state<string | null>(null);

	async function toggleDriver(legKey: string, driverId: string, assigned: boolean): Promise<void> {
		const [fromStageId, toStageId] = legKey.split('-');
		if (!fromStageId || !toStageId) return;
		const key = `${legKey}-${driverId}`;
		toggling = key;
		const formData = new FormData();
		formData.append('selectedDate', selectedDate);
		formData.append('fromStageId', fromStageId);
		formData.append('toStageId', toStageId);
		formData.append('driverId', driverId);
		formData.append('assigned', assigned ? '1' : '0');
		const sep = $page.url.search ? '&' : '?';
		const url = `${$page.url.pathname}${$page.url.search ?? ''}${sep}/toggleDriver`;
		try {
			const res = await fetch(url, { method: 'POST', body: formData });
			if (res.ok) await invalidateAll();
		} finally {
			toggling = null;
		}
	}

	function isAssigned(legKey: string, driverId: string): boolean {
		const ids = driverAssignments[legKey];
		return !!ids?.includes(driverId);
	}
</script>

<section class="transfers-section">
	<h2 class="section-title">
		Transfers{#if selectedDate} – {formatDate(selectedDate)}{/if}
	</h2>

	{#if !legSummaries || legSummaries.length === 0}
		<p class="empty-state">No transfers scheduled for this date.</p>
	{:else}
		{#if Object.keys(groupedByDirection.northbound).length > 0}
			<div class="direction-group">
				<h3 class="direction-title">Northbound (Lagos → S. Torpes)</h3>
				<table class="transfers-table">
					<thead>
						<tr>
							<th class="col-route">Route / Bookings</th>
							{#each drivers as driver}
								<th class="col-driver">{driverLabel(driver)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each Object.entries(groupedByDirection.northbound) as [key, summaries]}
							{@const [fromId, toId] = key.split('-')}
							<tr>
								<td class="col-route">
									<div class="leg-title">{getStepLabel(fromId, toId)}</div>
									<ul class="booking-list">
										{#each summaries as s}
											<li class="booking-line">
												<span class="bags">{s.numBags} {s.numBags === 1 ? 'bag' : 'bags'}</span>
												<span class="ref">– #{s.bookingShortRef}</span>
												<span class="hotels">
													{#if s.startHotelName}{s.startHotelName}{:else}Start hotel{/if}
													→
													{#if s.endHotelName}{s.endHotelName}{:else}Destination hotel{/if}
												</span>
											</li>
										{/each}
									</ul>
								</td>
								{#each drivers as driver}
									{@const busy = toggling === `${key}-${driver.id}`}
									<td class="col-driver">
										<label class="checkbox-cell">
											<input
												type="checkbox"
												checked={isAssigned(key, driver.id)}
												disabled={busy}
												onchange={(e) => toggleDriver(key, driver.id, (e.currentTarget as HTMLInputElement).checked)}
											/>
											<span class="check-label">Assign</span>
										</label>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		{#if Object.keys(groupedByDirection.southbound).length > 0}
			<div class="direction-group">
				<h3 class="direction-title">Southbound (S. Torpes → Lagos)</h3>
				<table class="transfers-table">
					<thead>
						<tr>
							<th class="col-route">Route / Bookings</th>
							{#each drivers as driver}
								<th class="col-driver">{driverLabel(driver)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each Object.entries(groupedByDirection.southbound) as [key, summaries]}
							{@const [fromId, toId] = key.split('-')}
							<tr>
								<td class="col-route">
									<div class="leg-title">{getStepLabel(fromId, toId)}</div>
									<ul class="booking-list">
										{#each summaries as s}
											<li class="booking-line">
												<span class="bags">{s.numBags} {s.numBags === 1 ? 'bag' : 'bags'}</span>
												<span class="ref">– #{s.bookingShortRef}</span>
												<span class="hotels">
													{#if s.startHotelName}{s.startHotelName}{:else}Start hotel{/if}
													→
													{#if s.endHotelName}{s.endHotelName}{:else}Destination hotel{/if}
												</span>
											</li>
										{/each}
									</ul>
								</td>
								{#each drivers as driver}
									{@const busy = toggling === `${key}-${driver.id}`}
									<td class="col-driver">
										<label class="checkbox-cell">
											<input
												type="checkbox"
												checked={isAssigned(key, driver.id)}
												disabled={busy}
												onchange={(e) => toggleDriver(key, driver.id, (e.currentTarget as HTMLInputElement).checked)}
											/>
											<span class="check-label">Assign</span>
										</label>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</section>

<style>
	.transfers-section {
		width: 100%;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1d21;
		margin: 0 0 0.75rem 0;
	}

	.direction-group {
		margin-top: 1.25rem;
	}

	.direction-title {
		margin: 0 0 0.5rem 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: #374151;
	}

	.empty-state {
		padding: 1.5rem 0;
		text-align: center;
		color: #5f6368;
		font-size: 0.9rem;
		font-style: italic;
	}

	.transfers-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.transfers-table th,
	.transfers-table td {
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
		vertical-align: top;
	}

	.transfers-table thead th {
		font-weight: 600;
		color: #374151;
		background: #f9fafb;
	}

	.col-route {
		min-width: 200px;
	}

	.col-driver {
		width: 1%;
		white-space: nowrap;
		text-align: center;
	}

	.checkbox-cell {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
	}

	.checkbox-cell input[type='checkbox'] {
		cursor: pointer;
	}

	.checkbox-cell input:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.check-label {
		color: #6b7280;
		font-size: 0.85rem;
	}

	.leg-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 0.25rem;
	}

	.booking-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.booking-line {
		font-size: 0.9rem;
		color: #374151;
		padding: 0.15rem 0;
	}

	.booking-line .bags {
		font-weight: 600;
		margin-right: 0.25rem;
	}

	.booking-line .ref {
		margin-right: 0.35rem;
		color: #4b5563;
	}

	.booking-line .hotels {
		color: #111827;
	}
</style>


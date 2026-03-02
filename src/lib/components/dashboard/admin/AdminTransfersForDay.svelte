<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { getStepLabel } from '$lib/delivery-steps';
	import { STAGES } from '$lib/trail';
	import type { LegSummaryForDate } from '$lib/server/driver-assignment/calendar-summary';
	import ViewModal from './ViewModal.svelte';

	type Driver = { id: string; username: string; firstName: string | null; lastName: string | null };

	type BookingDetail = {
		id: string;
		userId: string | null;
		status: string | null;
		firstName: string | null;
		lastName: string | null;
		userFirstName: string | null;
		userLastName: string | null;
		email: string | null;
		phone: string | null;
		departureDate: Date | null;
		departureStageId: string | null;
		destinationStageId: string | null;
		totalPrice: string | null;
		createdAt: Date | null;
	};

	let { selectedDate, legSummaries, drivers, driverAssignments, bookingDetailsById } = $props<{
		selectedDate: string;
		legSummaries: LegSummaryForDate[];
		drivers: Driver[];
		driverAssignments: Record<string, string[]>;
		bookingDetailsById: Record<string, BookingDetail>;
	}>();

	const t = $derived(translations[$language]);

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
		if (d.firstName || d.lastName)
			return [d.firstName, d.lastName].filter(Boolean).join(' ').trim();
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

	let viewingBookingId = $state<string | null>(null);

	function openBooking(bookingId: string): void {
		viewingBookingId = bookingId;
	}

	function closeModal(): void {
		viewingBookingId = null;
	}

	const selectedBooking = $derived(
		viewingBookingId ? ((bookingDetailsById ?? {})[viewingBookingId] ?? null) : null
	);

	const stageNames = $derived(Object.fromEntries(STAGES.map((s) => [s.id, s.name])));

	function formatDetailDate(date: Date | null): string {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<section class="transfers-section">
	<div class="section-header">
		<h2 class="section-title">
			{t.transfers_section_title}{#if selectedDate}
				– {formatDate(selectedDate)}{/if}
		</h2>
	</div>

	{#if !legSummaries || legSummaries.length === 0}
		<div class="empty-state">{t.transfers_empty}</div>
	{:else}
		{#if Object.keys(groupedByDirection.northbound).length > 0}
			<div class="direction-group">
				<h3 class="direction-title">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="18 15 12 9 6 15"></polyline>
					</svg>
					{t.transfers_northbound}
				</h3>
				<div class="table-container">
					<table class="data-table">
						<thead>
							<tr>
								<th class="col-route">{t.transfers_route_bookings}</th>
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
													<span class="bags"
														>{s.numBags}
														{s.numBags === 1 ? t.transfers_bag : t.transfers_bags}</span
													>
													<button
														type="button"
														class="ref ref-link"
														onclick={() => openBooking(s.bookingId)}
													>
														– #{s.bookingShortRef}
													</button>
													<span class="hotels">
														{#if s.startHotelName}{s.startHotelName}{:else}{t.transfers_start_hotel}{/if}
														→
														{#if s.endHotelName}{s.endHotelName}{:else}{t.transfers_destination_hotel}{/if}
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
													onchange={(e) =>
														toggleDriver(
															key,
															driver.id,
															(e.currentTarget as HTMLInputElement).checked
														)}
												/>
												<span class="check-label">{t.transfers_assign}</span>
											</label>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		{#if Object.keys(groupedByDirection.southbound).length > 0}
			<div class="direction-group">
				<h3 class="direction-title">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
					{t.transfers_southbound}
				</h3>
				<div class="table-container">
					<table class="data-table">
						<thead>
							<tr>
								<th class="col-route">{t.transfers_route_bookings}</th>
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
													<span class="bags"
														>{s.numBags}
														{s.numBags === 1 ? t.transfers_bag : t.transfers_bags}</span
													>
													<button
														type="button"
														class="ref ref-link"
														onclick={() => openBooking(s.bookingId)}
													>
														– #{s.bookingShortRef}
													</button>
													<span class="hotels">
														{#if s.startHotelName}{s.startHotelName}{:else}{t.transfers_start_hotel}{/if}
														→
														{#if s.endHotelName}{s.endHotelName}{:else}{t.transfers_destination_hotel}{/if}
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
													onchange={(e) =>
														toggleDriver(
															key,
															driver.id,
															(e.currentTarget as HTMLInputElement).checked
														)}
												/>
												<span class="check-label">{t.transfers_assign}</span>
											</label>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}

	{#if selectedBooking}
		<ViewModal
			title={t.bookings_modal_title + ' ' + selectedBooking.id.slice(0, 8)}
			isOpen={!!selectedBooking}
			onClose={closeModal}
		>
			<div class="view-details">
				<div class="detail-row">
					<strong>{t.bookings_table_id}:</strong>
					<span>{selectedBooking.id}</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_table_customer}:</strong>
					<span>
						{(selectedBooking.userFirstName ?? selectedBooking.firstName) || ''}
						{(selectedBooking.userLastName ?? selectedBooking.lastName) || ''}
						{#if !(selectedBooking.userFirstName ?? selectedBooking.firstName) && !(selectedBooking.userLastName ?? selectedBooking.lastName)}
							<span class="muted">—</span>
						{/if}
					</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_table_email}:</strong>
					<span>{selectedBooking.email || '—'}</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_table_phone}:</strong>
					<span>{selectedBooking.phone || '—'}</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_table_route}:</strong>
					<span>
						{stageNames[selectedBooking.departureStageId ?? ''] ??
							selectedBooking.departureStageId ??
							'—'}
						→
						{stageNames[selectedBooking.destinationStageId ?? ''] ??
							selectedBooking.destinationStageId ??
							'—'}
					</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_modal_departure_date}:</strong>
					<span>{formatDetailDate(selectedBooking.departureDate)}</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_table_status}:</strong>
					<span>
						<span class="status-badge status-{selectedBooking.status ?? 'pending'}">
							{selectedBooking.status ?? 'pending'}
						</span>
					</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_modal_total_price}:</strong>
					<span>{selectedBooking.totalPrice ? `€${selectedBooking.totalPrice}` : '—'}</span>
				</div>
				<div class="detail-row">
					<strong>{t.bookings_table_created}:</strong>
					<span>{formatDetailDate(selectedBooking.createdAt)}</span>
				</div>
			</div>
		</ViewModal>
	{:else if viewingBookingId && !bookingDetailsById[viewingBookingId]}
		<ViewModal title={t.bookings_modal_title} isOpen={true} onClose={closeModal}>
			<p class="muted">{t.transfers_booking_unavailable}</p>
		</ViewModal>
	{/if}
</section>

<style>
	.transfers-section {
		width: 100%;
		padding: 1.5rem;
	}

	.section-header {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		margin: 0;
	}

	.direction-group {
		margin-bottom: 2rem;
	}

	.direction-group:last-child {
		margin-bottom: 0;
	}

	.direction-title {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-secondary, #f5f5f0);
		border-radius: 8px;
	}

	.empty-state {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-light, #666666);
		font-size: 1rem;
		font-style: italic;
	}

	.table-container {
		overflow-x: auto;
	}

	/* Table styling */
	.data-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
	}

	.data-table thead {
		background: var(--color-secondary, #f5f5f0);
	}

	.data-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.8125rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-light, #666666);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		font-size: 0.9375rem;
		color: var(--color-text, #333333);
		vertical-align: top;
	}

	.data-table tbody tr:hover {
		background: rgba(245, 245, 240, 0.5);
	}

	.data-table tbody tr:last-child td {
		border-bottom: none;
	}

	.col-route {
		min-width: 300px;
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
		width: 18px;
		height: 18px;
		accent-color: var(--color-accent, #c4a77d);
	}

	.checkbox-cell input:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.check-label {
		color: var(--color-text-light, #666666);
		font-size: 0.85rem;
	}

	.leg-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		margin-bottom: 0.5rem;
	}

	.booking-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.booking-line {
		font-size: 0.875rem;
		color: var(--color-text, #333333);
		padding: 0.35rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.booking-line .bags {
		font-weight: 600;
		color: var(--color-accent-dark, #a08960);
	}

	.booking-line .ref {
		color: var(--color-text-light, #666666);
	}

	.booking-line .hotels {
		color: var(--color-primary, #1a1a1a);
	}

	.ref-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--color-accent, #c4a77d);
		cursor: pointer;
		text-decoration: underline;
		font-weight: 500;
	}

	.ref-link:hover {
		color: var(--color-accent-dark, #a08960);
	}

	/* View Modal Details */
	.view-details {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.detail-row {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-row strong {
		min-width: 150px;
		color: var(--color-primary, #1a1a1a);
		font-weight: 600;
	}

	.detail-row span {
		color: var(--color-text, #333333);
	}

	.muted {
		color: var(--color-text-light, #666666);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-pending {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	.status-paid {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.status-cancelled {
		background: rgba(220, 38, 38, 0.12);
		color: #dc2626;
	}
</style>

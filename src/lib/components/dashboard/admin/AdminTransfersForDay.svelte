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

	let viewingBookingId = $state<string | null>(null);

	function openBooking(bookingId: string): void {
		viewingBookingId = bookingId;
	}

	function closeModal(): void {
		viewingBookingId = null;
	}

	const selectedBooking = $derived(
		viewingBookingId ? (bookingDetailsById ?? {})[viewingBookingId] ?? null : null
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
	<h2 class="section-title">
		{t.transfers_section_title}{#if selectedDate} – {formatDate(selectedDate)}{/if}
	</h2>

	{#if !legSummaries || legSummaries.length === 0}
		<p class="empty-state">{t.transfers_empty}</p>
	{:else}
		{#if Object.keys(groupedByDirection.northbound).length > 0}
			<div class="direction-group">
				<h3 class="direction-title">{t.transfers_northbound}</h3>
				<table class="transfers-table">
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
												<span class="bags">{s.numBags} {s.numBags === 1 ? t.transfers_bag : t.transfers_bags}</span>
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
												onchange={(e) => toggleDriver(key, driver.id, (e.currentTarget as HTMLInputElement).checked)}
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
		{/if}

		{#if Object.keys(groupedByDirection.southbound).length > 0}
			<div class="direction-group">
				<h3 class="direction-title">{t.transfers_southbound}</h3>
				<table class="transfers-table">
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
												<span class="bags">{s.numBags} {s.numBags === 1 ? t.transfers_bag : t.transfers_bags}</span>
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
												onchange={(e) => toggleDriver(key, driver.id, (e.currentTarget as HTMLInputElement).checked)}
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
						{#if !(selectedBooking.userFirstName ?? selectedBooking.firstName) &&
							!(selectedBooking.userLastName ?? selectedBooking.lastName)}
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
						{stageNames[selectedBooking.departureStageId ?? ''] ?? selectedBooking.departureStageId ?? '—'}
						→
						{stageNames[selectedBooking.destinationStageId ?? ''] ?? selectedBooking.destinationStageId ?? '—'}
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
		<ViewModal
			title={t.bookings_modal_title}
			isOpen={true}
			onClose={closeModal}
		>
			<p class="muted">{t.transfers_booking_unavailable}</p>
		</ViewModal>
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

	.ref-link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: #4b5563;
		cursor: pointer;
		text-decoration: underline;
	}

	.ref-link:hover {
		color: #111827;
	}

	.view-details {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.detail-row {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e9ecef;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-row strong {
		min-width: 150px;
		color: #333;
	}

	.detail-row span {
		color: #666;
	}

	.muted {
		color: #999;
	}

	.status-badge {
		display: inline-block;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	.status-pending {
		background: #fff3cd;
		color: #856404;
	}

	.status-paid {
		background: #d4edda;
		color: #155724;
	}

	.status-cancelled {
		background: #f8d7da;
		color: #721c24;
	}
</style>


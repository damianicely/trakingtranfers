<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import AccountInfo from './AccountInfo.svelte';
	import { STAGES, formatDate } from '$lib/trail';

	let { user, data, form } = $props<{
		user: { username: string; id: string; role: string };
		data: {
			bookings: Array<{
				id: string;
				departureDate: Date | null;
				departureStageId: string | null;
				destinationStageId: string | null;
				status: string;
				totalPrice: string | null;
			}>;
			segmentsByBooking: Record<
				string,
				Array<{
					id: string;
					segmentIndex: string;
					fromStageId: string;
					toStageId: string;
					travelDate: Date;
					startHotelId: string | null;
					endHotelId: string | null;
					hotelNotes: string | null;
				}>
			>;
			hotelsByLocation: Record<
				string,
				Array<{ id: string; name: string; contactInfo: string | null }>
			>;
		};
		form?: { success?: boolean; message?: string };
	}>();

	const t = $derived(translations[$language]);

	const stageNames = Object.fromEntries(STAGES.map((s) => [s.id, s.name]));

	const getHotelsForLocation = (locationId: string) => {
		return data.hotelsByLocation[locationId] || [];
	};

	const formatDateString = (date: Date | null) => {
		if (!date) return '';
		return formatDate(date.toISOString().split('T')[0], 0);
	};

	const getHotelName = (hotelId: string | null): string | null => {
		if (!hotelId) return null;
		const allHotels = Object.values(data.hotelsByLocation) as Array<{ id: string; name: string }>[];
		for (const hotels of allHotels) {
			const h = hotels.find((x: { id: string }) => x.id === hotelId);
			if (h) return h.name;
		}
		return null;
	};

	// Client-side state so "next day start = previous day end" updates immediately when user selects end hotel
	type SegmentHotelState = { startHotelId: string | null; endHotelId: string | null; notes: string | null };
	let segmentHotels = $state<Record<string, SegmentHotelState>>({});

	$effect(() => {
		const next: Record<string, SegmentHotelState> = {};
		for (const booking of data.bookings) {
			const segments = data.segmentsByBooking[booking.id] || [];
			for (const seg of segments) {
				next[seg.id] = {
					startHotelId: seg.startHotelId ?? null,
					endHotelId: seg.endHotelId ?? null,
					notes: seg.hotelNotes ?? null
				};
			}
		}
		segmentHotels = next;
	});

	const segmentState = (segmentId: string) => segmentHotels[segmentId] ?? { startHotelId: null, endHotelId: null, notes: null };

	const updateSegmentEnd = (segmentId: string, endHotelId: string | null) => {
		const cur = segmentHotels[segmentId];
		if (!cur) return;
		segmentHotels = { ...segmentHotels, [segmentId]: { ...cur, endHotelId } };
	};
	const updateSegmentStart = (segmentId: string, startHotelId: string | null) => {
		const cur = segmentHotels[segmentId];
		if (!cur) return;
		segmentHotels = { ...segmentHotels, [segmentId]: { ...cur, startHotelId } };
	};
	const updateSegmentNotes = (segmentId: string, notes: string | null) => {
		const cur = segmentHotels[segmentId];
		if (!cur) return;
		segmentHotels = { ...segmentHotels, [segmentId]: { ...cur, notes } };
	};

	let saving = $state(false);

	const triggerSave = async (e: Event) => {
		const form = (e.target as HTMLElement).closest('form');
		if (!form || saving) return;
		saving = true;
		try {
			const formData = new FormData(form);
			const res = await fetch('?/updateBookingHotels', { method: 'POST', body: formData });
			if (res.ok) await invalidateAll();
		} finally {
			saving = false;
		}
	};
</script>

<div class="customer-dashboard">
<section class="dashboard-section">
	<h2>{t.dashboard_section_bookings_title}</h2>
	<p>{t.dashboard_section_bookings_description}</p>

	{#if form?.success}
		<div class="success-message">{form.message || 'Hotel information updated successfully'}</div>
	{/if}

	{#if form?.message && !form?.success}
		<div class="error-message">{form.message}</div>
	{/if}

	{#if data.bookings.length === 0}
		<div class="placeholder">
			<p>
				{t.dashboard_section_bookings_empty} <a href="/">{t.dashboard_section_bookings_create_link}</a>
			</p>
		</div>
	{:else}
		<div class="bookings-list">
			{#each data.bookings as booking}
				{@const segments = data.segmentsByBooking[booking.id] || []}
				<div class="booking-card">
					<div class="booking-header">
						<h3>
							Booking #{booking.id.slice(0, 8)} - {formatDateString(booking.departureDate)}
						</h3>
						<div class="booking-meta">
							<span class="status-badge status-{booking.status}">{booking.status}</span>
							{#if booking.totalPrice}
								<span class="price">€{booking.totalPrice}</span>
							{/if}
						</div>
					</div>

					{#if segments.length > 0}
						<form method="POST" action="?/updateBookingHotels" class="hotel-form">
							<input type="hidden" name="bookingId" value={booking.id} />

							<div class="itinerary">
								<h4>Itinerary & Hotel Selection</h4>
								{#each segments as segment, index}
									{@const fromHotels = getHotelsForLocation(segment.fromStageId)}
									{@const toHotels = getHotelsForLocation(segment.toStageId)}
									{@const prevSegment = segments[index - 1]}
									{@const state = segmentState(segment.id)}
									{@const effectiveStartHotel = index === 0 ? state.startHotelId : (prevSegment ? segmentState(prevSegment.id).endHotelId : null)}

									<div class="segment-row">
										<div class="segment-info">
											<div class="segment-date">
												{formatDate(booking.departureDate?.toISOString().split('T')[0] || '', parseInt(segment.segmentIndex || '0', 10))}
											</div>
											<div class="segment-route">
												{stageNames[segment.fromStageId] || segment.fromStageId} →
												{stageNames[segment.toStageId] || segment.toStageId}
											</div>
										</div>

										<div class="hotel-selections">
											<div class="hotel-field">
												<label>Start Hotel ({stageNames[segment.fromStageId] || segment.fromStageId})</label>
												{#if index === 0}
													<select
														name="segment_{segment.id}_startHotel"
														value={state.startHotelId || ''}
														onchange={(e) => {
															const v = (e.target as HTMLSelectElement).value || null;
															updateSegmentStart(segment.id, v);
															triggerSave(e);
														}}
													>
														<option value="">No hotel selected</option>
														{#each fromHotels as hotel}
															<option value={hotel.id}>{hotel.name}</option>
														{/each}
													</select>
												{:else}
													<div class="read-only-hotel">
														{getHotelName(effectiveStartHotel) ?? '—'}
														<span class="auto-fill-note">(previous night’s end hotel)</span>
													</div>
												{/if}
											</div>

											<div class="hotel-field">
												<label>End Hotel ({stageNames[segment.toStageId] || segment.toStageId})</label>
												<select
													name="segment_{segment.id}_endHotel"
													value={state.endHotelId || ''}
													onchange={(e) => {
														const v = (e.target as HTMLSelectElement).value || null;
														updateSegmentEnd(segment.id, v);
														triggerSave(e);
													}}
												>
													<option value="">No hotel selected</option>
													{#each toHotels as hotel}
														<option value={hotel.id}>{hotel.name}</option>
													{/each}
												</select>
											</div>

											<div class="hotel-field notes-field">
												<label>Extra Details</label>
												<textarea
													name="segment_{segment.id}_notes"
													placeholder="Additional hotel information, special requests..."
													rows="2"
													value={state.notes ?? ''}
													oninput={(e) => updateSegmentNotes(segment.id, (e.target as HTMLTextAreaElement).value || null)}
													onblur={triggerSave}
												></textarea>
											</div>
										</div>
									</div>
								{/each}
							</div>

							{#if saving}
								<p class="save-status">Saving…</p>
							{/if}
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>

<AccountInfo {user} roleLabel={t.dashboard_role_customer} />
</div>

<style>
	.customer-dashboard {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 2rem;
	}
	.dashboard-section {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.dashboard-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dashboard-section > p {
		margin: 0 0 1rem 0;
		color: #666;
		font-size: 0.9rem;
	}

	.success-message {
		background: #d4edda;
		color: #155724;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.placeholder {
		padding: 2rem;
		text-align: center;
		background: white;
		border-radius: 4px;
		color: #999;
	}

	.placeholder a {
		color: #007bff;
		text-decoration: none;
	}

	.placeholder a:hover {
		text-decoration: underline;
	}

	.bookings-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.booking-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.booking-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.booking-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.booking-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
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

	.price {
		font-weight: 600;
		color: #1a1a1a;
		font-size: 1.1rem;
	}

	.itinerary h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: #333;
	}

	.segment-row {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.segment-row:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.segment-info {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		align-items: center;
	}

	.segment-date {
		font-weight: 600;
		color: #333;
		min-width: 100px;
	}

	.segment-route {
		color: #666;
		font-weight: 500;
	}

	.hotel-selections {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.hotel-field {
		display: flex;
		flex-direction: column;
	}

	.hotel-field label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.read-only-hotel {
		padding: 0.5rem 0;
		color: #333;
	}
	.read-only-hotel .auto-fill-note {
		display: block;
		font-size: 0.8rem;
		color: #666;
		margin-top: 0.2rem;
	}
	.save-status {
		margin: 0.5rem 0 0 0;
		font-size: 0.9rem;
		color: #666;
	}
	.hotel-field select,
	.hotel-field textarea {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.auto-fill-note {
		font-size: 0.75rem;
		color: #007bff;
		font-style: italic;
		margin-top: 0.25rem;
	}

	.form-actions {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.btn-save {
		padding: 0.75rem 2rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: background-color 0.2s;
	}

	.btn-save:hover {
		background: #0056b3;
	}
</style>

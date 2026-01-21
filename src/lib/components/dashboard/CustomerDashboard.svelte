<script lang="ts">
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
</script>

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
									{@const autoStartHotel = prevSegment?.endHotelId || null}
									{@const effectiveStartHotel = segment.startHotelId || autoStartHotel}

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
												<select name="segment_{segment.id}_startHotel" value={effectiveStartHotel || ''}>
													<option value="">No hotel selected</option>
													{#each fromHotels as hotel}
														<option value={hotel.id} selected={effectiveStartHotel === hotel.id}>
															{hotel.name}
														</option>
													{/each}
												</select>
												{#if autoStartHotel && !segment.startHotelId}
													<span class="auto-fill-note">(Auto-filled from previous day)</span>
												{/if}
											</div>

											<div class="hotel-field">
												<label>End Hotel ({stageNames[segment.toStageId] || segment.toStageId})</label>
												<select name="segment_{segment.id}_endHotel" value={segment.endHotelId || ''}>
													<option value="">No hotel selected</option>
													{#each toHotels as hotel}
														<option value={hotel.id} selected={segment.endHotelId === hotel.id}>
															{hotel.name}
														</option>
													{/each}
												</select>
											</div>

											<div class="hotel-field notes-field">
												<label>Extra Details</label>
												<textarea
													name="segment_{segment.id}_notes"
													placeholder="Additional hotel information, special requests..."
													rows="2"
												>{segment.hotelNotes || ''}</textarea>
											</div>
										</div>
									</div>
								{/each}
							</div>

							<div class="form-actions">
								<button type="submit" class="btn-save">Save Hotel Information</button>
							</div>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>

<AccountInfo {user} roleLabel={t.dashboard_role_customer} />

<style>
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
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 1rem;
	}

	@media (max-width: 768px) {
		.hotel-selections {
			grid-template-columns: 1fr;
		}
	}

	.hotel-field {
		display: flex;
		flex-direction: column;
	}

	.hotel-field.notes-field {
		grid-column: 1 / -1;
	}

	.hotel-field label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #666;
		margin-bottom: 0.5rem;
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

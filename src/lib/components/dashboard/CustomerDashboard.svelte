<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
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
			bagsByBooking?: Record<
				string,
				Array<{ bagId: string; label: string; locationLabel: string }>
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
		const allHotels = Object.values(data.hotelsByLocation) as Array<{ id: string; name: string }[]>;
		for (const hotels of allHotels) {
			const h = hotels.find((x: { id: string }) => x.id === hotelId);
			if (h) return h.name;
		}
		return null;
	};

	// Check if booking has all hotels selected
	const hasAllHotelsSelected = (bookingId: string): boolean => {
		const segments = data.segmentsByBooking[bookingId] || [];
		if (segments.length === 0) return true;

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			// Check start hotel for first segment
			if (i === 0 && !segment.startHotelId) return false;
			// Check end hotel for all segments
			if (!segment.endHotelId) return false;
		}
		return true;
	};

	// Client-side state
	type SegmentHotelState = {
		startHotelId: string | null;
		endHotelId: string | null;
		notes: string | null;
	};
	let segmentHotels = $state<Record<string, SegmentHotelState>>({});

	// Track expanded bookings
	let expandedBookings = $state<Record<string, boolean>>({});

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

	const segmentState = (segmentId: string) =>
		segmentHotels[segmentId] ?? { startHotelId: null, endHotelId: null, notes: null };

	const toggleBookingExpand = (bookingId: string) => {
		expandedBookings = { ...expandedBookings, [bookingId]: !expandedBookings[bookingId] };
	};

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
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.dashboard_nav_bookings}</h1>
	</div>

	<!-- Bookings Section -->
	<section class="content-section">
		<div class="data-table-container">
			<div class="section-header">
				<div>
					<h2 class="section-title">{t.dashboard_section_bookings_title}</h2>
					<p class="section-desc">{t.dashboard_section_bookings_description}</p>
				</div>
			</div>

			{#if form?.success}
				<div class="success-message">
					{form.message || 'Hotel information updated successfully'}
				</div>
			{/if}

			{#if form?.message && !form?.success}
				<div class="error-message">{form.message}</div>
			{/if}

			{#if data.bookings.length === 0}
				<div class="empty-state">
					<svg
						width="48"
						height="48"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
					<p>{t.dashboard_section_bookings_empty}</p>
				</div>
			{:else}
				<div class="bookings-list">
					{#each data.bookings as booking}
						{@const segments = data.segmentsByBooking[booking.id] || []}
						{@const isExpanded = expandedBookings[booking.id] || false}
						{@const hotelsComplete = hasAllHotelsSelected(booking.id)}
						<div class="booking-card" class:expanded={isExpanded}>
							<div class="booking-header">
								<div class="booking-info">
									<div class="booking-main">
										<h3>Booking #{booking.id.slice(0, 8)}</h3>
										<p class="booking-date">{formatDateString(booking.departureDate)}</p>
									</div>
									<div class="booking-badges">
										<span class="status-badge status-{booking.status}">{booking.status}</span>
										{#if !hotelsComplete}
											<span class="warning-badge" title={t.dashboard_hotels_missing}>
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<path
														d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
													></path>
													<line x1="12" y1="9" x2="12" y2="13"></line>
													<line x1="12" y1="17" x2="12.01" y2="17"></line>
												</svg>
											</span>
										{/if}
									</div>
								</div>
								<div class="booking-meta">
									{#if booking.totalPrice}
										<span class="price">€{booking.totalPrice}</span>
									{/if}
									<button
										type="button"
										class="expand-btn"
										onclick={() => toggleBookingExpand(booking.id)}
									>
										{#if isExpanded}
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
											{t.dashboard_collapse_booking}
										{:else}
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
											{t.dashboard_expand_booking}
										{/if}
									</button>
								</div>
							</div>

							{#if isExpanded}
								<div class="booking-details">
									{#if data.bagsByBooking?.[booking.id]?.length}
										<div class="bags-section">
											<h4>Bags</h4>
											<div class="bags-list">
												{#each data.bagsByBooking[booking.id] as bag}
													<div class="bag-item">
														<span class="bag-label">Bag {bag.label}</span>
														<span class="bag-location">{bag.locationLabel}</span>
													</div>
												{/each}
											</div>
										</div>
									{/if}

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
													{@const effectiveStartHotel =
														index === 0
															? state.startHotelId
															: prevSegment
																? segmentState(prevSegment.id).endHotelId
																: null}

													<div class="segment-table">
														<div class="segment-header">
															<svg
																class="segment-icon"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
															>
																<circle cx="12" cy="12" r="10"></circle>
																<polyline points="12 6 12 12 16 14"></polyline>
															</svg>
															<span class="segment-day"
																>Day {parseInt(segment.segmentIndex || '0', 10) + 1}:</span
															>
															<span class="segment-route">
																{formatDate(
																	booking.departureDate?.toISOString().split('T')[0] || '',
																	parseInt(segment.segmentIndex || '0', 10)
																)} —
																{stageNames[segment.fromStageId] || segment.fromStageId} → {stageNames[
																	segment.toStageId
																] || segment.toStageId}
															</span>
														</div>
														<div class="hotel-table">
															<div class="hotel-cell">
																<span class="hotel-label">Start Hotel</span>
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
																		<option value="">Select hotel...</option>
																		{#each fromHotels as hotel}
																			<option value={hotel.id}>{hotel.name}</option>
																		{/each}
																	</select>
																{:else}
																	<span class="hotel-value"
																		>{getHotelName(effectiveStartHotel) ?? '—'}</span
																	>
																{/if}
															</div>
															<div class="hotel-cell">
																<span class="hotel-label">End Hotel</span>
																<select
																	name="segment_{segment.id}_endHotel"
																	value={state.endHotelId || ''}
																	onchange={(e) => {
																		const v = (e.target as HTMLSelectElement).value || null;
																		updateSegmentEnd(segment.id, v);
																		triggerSave(e);
																	}}
																>
																	<option value="">Select hotel...</option>
																	{#each toHotels as hotel}
																		<option value={hotel.id}>{hotel.name}</option>
																	{/each}
																</select>
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
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.customer-dashboard {
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
		padding: 1.5rem;
		background: var(--color-secondary, #f5f5f0);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
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

	/* Messages */
	.success-message {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		margin: 1rem 1.5rem;
		font-weight: 500;
	}

	.error-message {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		margin: 1rem 1.5rem;
		font-weight: 500;
	}

	/* Empty State */
	.empty-state {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-light, #666666);
		font-size: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.empty-state svg {
		color: var(--color-border, #e0e0e0);
	}

	/* Bookings List */
	.bookings-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
	}

	.booking-card {
		background: var(--color-secondary, #f5f5f0);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.booking-card:hover {
		background: #ebebe6;
	}

	.booking-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		cursor: pointer;
	}

	.booking-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.booking-main h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	.booking-date {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-light, #666666);
	}

	.booking-badges {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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

	.status-paid {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.status-pending {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	.status-cancelled {
		background: rgba(220, 38, 38, 0.12);
		color: #dc2626;
	}

	.warning-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: rgba(245, 158, 11, 0.15);
		border-radius: 50%;
		color: #f59e0b;
		cursor: help;
	}

	.booking-meta {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.price {
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		font-size: 1.1rem;
	}

	.expand-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #ffffff;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 8px;
		color: var(--color-text, #333333);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.expand-btn:hover {
		background: var(--color-secondary, #f5f5f0);
		border-color: var(--color-text-light, #666666);
	}

	/* Booking Details (Expanded) */
	.booking-details {
		padding: 0 1.5rem 1.5rem 1.5rem;
		border-top: 1px solid var(--color-border, #e0e0e0);
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Bags Section */
	.bags-section {
		margin: 1.5rem 0;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
	}

	.bags-section h4 {
		margin: 0 0 0.75rem 0;
		font-size: 0.95rem;
		color: var(--color-primary, #1a1a1a);
		font-weight: 600;
	}

	.bags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.bag-item {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: #ffffff;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.bag-label {
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	.bag-location {
		color: var(--color-text-light, #666666);
	}

	/* Itinerary */
	.itinerary h4 {
		margin: 1.5rem 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	.segment-table {
		background: #ffffff;
		border-radius: 8px;
		border: 1px solid var(--color-border, #e0e0e0);
		margin-bottom: 1.5rem;
		overflow: hidden;
	}

	.segment-table:last-child {
		margin-bottom: 0;
	}

	.segment-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		background: var(--color-secondary, #f5f5f0);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	.segment-icon {
		width: 18px;
		height: 18px;
		color: var(--color-accent, #c4a77d);
		flex-shrink: 0;
	}

	.segment-day {
		color: var(--color-accent-dark, #a08960);
	}

	.segment-route {
		color: var(--color-primary, #1a1a1a);
	}

	.hotel-table {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
	}

	.hotel-cell {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hotel-cell:first-child {
		border-right: 1px solid var(--color-border, #e0e0e0);
	}

	.hotel-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-light, #666666);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.hotel-cell select {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9375rem;
		font-family: inherit;
		background: #ffffff;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.hotel-cell select:focus {
		outline: none;
		border-color: var(--color-accent, #c4a77d);
		box-shadow: 0 0 0 3px rgba(196, 167, 125, 0.1);
	}

	.hotel-value {
		padding: 0.625rem 0;
		font-size: 0.9375rem;
		color: var(--color-text, #333333);
		font-weight: 500;
	}

	.save-status {
		margin: 1rem 0 0 0;
		font-size: 0.875rem;
		color: var(--color-text-light, #666666);
		font-style: italic;
	}

	@media (max-width: 768px) {
		.booking-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.booking-meta {
			width: 100%;
			justify-content: space-between;
		}

		.section-header {
			padding: 1rem;
		}

		.bookings-list {
			padding: 1rem;
		}

		.hotel-table {
			grid-template-columns: 1fr;
		}

		.hotel-cell:first-child {
			border-right: none;
			border-bottom: 1px solid var(--color-border, #e0e0e0);
		}
	}
</style>

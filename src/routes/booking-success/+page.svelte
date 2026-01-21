<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, formatDate } from '$lib/trail';

	let { data } = $props();

	const { booking, segments } = data;

	const t = $derived(translations[$language]);

	const stageNames = Object.fromEntries(STAGES.map((s) => [s.id, s.name]));

	const formatDateString = (date: Date | null) => {
		if (!date) return '';
		return new Date(date).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	};
</script>

<div class="success-page">
	<div class="success-container">
		<div class="success-icon">✓</div>
		<h1>{t.booking_success_title}</h1>
		<p class="success-message">{t.booking_success_message}</p>

		<div class="booking-details">
			<h2>{t.booking_success_details_title}</h2>

			<div class="detail-section">
				<h3>{t.booking_success_customer_title}</h3>
				<div class="detail-grid">
					<div class="detail-item">
						<strong>{t.booking_success_name}:</strong>
						<span>
							{booking.firstName || ''} {booking.lastName || ''}
							{#if !booking.firstName && !booking.lastName}
								<span class="muted">—</span>
							{/if}
						</span>
					</div>
					{#if booking.bookingOtherNames}
						<div class="detail-item">
							<strong>{t.booking_success_other_names}:</strong>
							<span>{booking.bookingOtherNames}</span>
						</div>
					{/if}
					<div class="detail-item">
						<strong>{t.booking_success_email}:</strong>
						<span>{booking.email || '—'}</span>
					</div>
					{#if booking.phone}
						<div class="detail-item">
							<strong>{t.booking_success_phone}:</strong>
							<span>{booking.phone}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="detail-section">
				<h3>{t.booking_success_trip_title}</h3>
				<div class="detail-grid">
					<div class="detail-item">
						<strong>{t.booking_success_departure_date}:</strong>
						<span>{formatDateString(booking.departureDate)}</span>
					</div>
					<div class="detail-item">
						<strong>{t.booking_success_route}:</strong>
						<span>
							{stageNames[booking.departureStageId || ''] || booking.departureStageId || '—'} →
							{stageNames[booking.destinationStageId || ''] || booking.destinationStageId || '—'}
						</span>
					</div>
					<div class="detail-item">
						<strong>{t.booking_success_transfers}:</strong>
						<span>{booking.numTransfers || '0'}</span>
					</div>
					<div class="detail-item">
						<strong>{t.booking_success_bags}:</strong>
						<span>{booking.numBags || '0'}</span>
					</div>
					<div class="detail-item">
						<strong>{t.booking_success_total_price}:</strong>
						<span class="price">€{booking.totalPrice || '0'}</span>
					</div>
				</div>
			</div>

			{#if segments && segments.length > 0}
				<div class="detail-section">
					<h3>{t.booking_success_itinerary_title}</h3>
					<div class="itinerary-list">
						{#each segments as segment, index}
							<div class="itinerary-item">
								<div class="itinerary-day">Day {index + 1}</div>
								<div class="itinerary-route">
									{formatDate(booking.departureDate?.toISOString().split('T')[0] || '', index)}: {stageNames[segment.fromStageId] || segment.fromStageId} → {stageNames[segment.toStageId] || segment.toStageId}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div class="detail-section">
				<h3>{t.booking_success_next_steps_title}</h3>
				<p>{t.booking_success_next_steps_message}</p>
			</div>
		</div>

		<div class="action-buttons">
			<a href="/" class="btn-primary">{t.booking_success_back_home}</a>
			{#if booking.userId}
				<a href="/dashboard" class="btn-secondary">{t.booking_success_view_dashboard}</a>
			{/if}
		</div>
	</div>
</div>

<style>
	.success-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.success-container {
		max-width: 800px;
		width: 100%;
		background: white;
		border-radius: 12px;
		padding: 3rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.success-icon {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: #28a745;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		margin: 0 auto 1.5rem;
		font-weight: bold;
	}

	h1 {
		margin: 0 0 1rem 0;
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.success-message {
		font-size: 1.1rem;
		color: #666;
		margin-bottom: 2.5rem;
	}

	.booking-details {
		text-align: left;
		margin: 2.5rem 0;
		padding-top: 2.5rem;
		border-top: 2px solid #e9ecef;
	}

	.booking-details h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1a1a1a;
		text-align: center;
	}

	.detail-section {
		margin-bottom: 2rem;
	}

	.detail-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e9ecef;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-item strong {
		font-size: 0.9rem;
		color: #666;
		font-weight: 600;
	}

	.detail-item span {
		font-size: 1rem;
		color: #1a1a1a;
	}

	.detail-item .price {
		font-size: 1.25rem;
		font-weight: 600;
		color: #28a745;
	}

	.muted {
		color: #999;
		font-style: italic;
	}

	.itinerary-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.itinerary-item {
		display: flex;
		gap: 1rem;
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 6px;
		align-items: center;
	}

	.itinerary-day {
		font-weight: 600;
		color: #007bff;
		min-width: 60px;
	}

	.itinerary-route {
		color: #333;
		flex: 1;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 2px solid #e9ecef;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 2rem;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
		display: inline-block;
	}

	.btn-primary {
		background: #007bff;
		color: white;
	}

	.btn-primary:hover {
		background: #0056b3;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-secondary:hover {
		background: #5a6268;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
	}

	@media (max-width: 768px) {
		.success-container {
			padding: 2rem 1.5rem;
		}

		.detail-grid {
			grid-template-columns: 1fr;
		}

		.action-buttons {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
		}
	}
</style>

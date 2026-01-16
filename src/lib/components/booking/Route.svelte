<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, generateRoute, formatDate, type Stage } from '$lib/trail';
	import { browser } from '$app/environment';

	$: t = translations[$language];

	export let aboutTrip: {
		departure: string;
		destination: string;
		departureDate: string;
		bags: string;
	};

	export let fieldErrors: Record<string, string>;
	export let validateField: (fieldName: string, value: string) => void;

	// Stage names mapping
	const stageNames = Object.fromEntries(STAGES.map((s: Stage) => [s.id, s.name]));

	// Generate route using generateRoute from trail.ts
	// Use reactive statement with explicit dependencies so Svelte tracks changes
	$: route = (() => {
		if (!aboutTrip.departure || !aboutTrip.destination) {
			return null;
		}
		if (aboutTrip.departure === aboutTrip.destination) {
			return null;
		}
		return generateRoute(aboutTrip.departure, aboutTrip.destination);
	})();

	// Helper function to get tomorrow's date as YYYY-MM-DD
	const getTomorrowDate = (): string => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	};

	// Placeholder for date blocking logic
	const isDateBlocked = (date: string): boolean => {
		// Placeholder for future date blocking logic
		// This can be expanded to check against a list of blocked dates/periods
		// Example: blockedDates array, blockedPeriods array, etc.
		// For now, returns false (no dates blocked)
		return false;
	};

	const getMinDate = (): string => {
		return getTomorrowDate();
	};

	// Track bags value separately to ensure reactivity
	$: bagsValue = aboutTrip.bags;
	$: routeLength = route?.length || 0;
	
	// Price calculation logic
	// - 4+ transfers: 15€ per transfer
	// - Up to 3 transfers: 20€ per transfer
	// - Rate includes up to 2 luggage pieces
	// - Each additional piece per transfer: 5€
	$: priceBreakdown = (() => {
		if (routeLength === 0) return null;
		if (!bagsValue) return null;
		
		const bagsStr = String(bagsValue).trim();
		if (!bagsStr || bagsStr === '0') return null;

		const numBags = parseInt(bagsStr, 10);
		if (!numBags || numBags <= 0 || isNaN(numBags)) return null;

		// Base price per transfer
		const pricePerTransfer = routeLength >= 4 ? 15 : 20;
		
		// Base cost (includes up to 2 bags per transfer)
		const baseCost = routeLength * pricePerTransfer;
		
		// Additional bags cost (bags beyond 2, per transfer)
		const additionalBags = Math.max(0, numBags - 2);
		const additionalBagsCost = routeLength * additionalBags * 5;
		
		const totalCost = baseCost + additionalBagsCost;

		return {
			numTransfers: routeLength,
			numBags,
			pricePerTransfer,
			baseCost,
			additionalBags,
			additionalBagsCost,
			totalCost
		};
	})();
</script>

<div class="booking-step basic-details-modern">
	<h3 class="step-title">{t.booking_step_about_trip_title}</h3>
	<form class="booking-form modern-form" onsubmit={(e) => { e.preventDefault(); }}>
		<div class="form-group modern-group">
			<label for="departureDate" class="form-label modern-label">{t.booking_departure_date_label}</label>
			<input
				type="date"
				id="departureDate"
				class="form-input modern-input"
				class:error={fieldErrors.departureDate}
				min={getMinDate()}
				bind:value={aboutTrip.departureDate}
				onblur={() => validateField('departureDate', aboutTrip.departureDate)}
				onchange={(e) => {
					const selectedDate = e.currentTarget.value;
					if (isDateBlocked(selectedDate)) {
						fieldErrors = { ...fieldErrors, departureDate: t.booking_departure_date_blocked || 'This date is not available' };
					} else {
						validateField('departureDate', selectedDate);
					}
				}}
			/>
			{#if fieldErrors.departureDate}
				<span class="error-message modern-error">{fieldErrors.departureDate}</span>
			{/if}
		</div>

		<div class="form-group modern-group">
			<label for="departure" class="form-label modern-label">{t.booking_departure_label}</label>
			<select
				id="departure"
				class="form-input modern-input"
				class:error={fieldErrors.departure}
				bind:value={aboutTrip.departure}
				onchange={() => validateField('departure', aboutTrip.departure)}
			>
				<option value="">{t.booking_departure_placeholder}</option>
				{#each STAGES as stage}
					<option value={stage.id}>{stage.name}</option>
				{/each}
			</select>
			{#if fieldErrors.departure}
				<span class="error-message modern-error">{fieldErrors.departure}</span>
			{/if}
		</div>

		<div class="form-group modern-group">
			<label for="destination" class="form-label modern-label">{t.booking_destination_label || 'Destination'}</label>
			<select
				id="destination"
				class="form-input modern-input"
				class:error={fieldErrors.destination}
				bind:value={aboutTrip.destination}
				onchange={() => validateField('destination', aboutTrip.destination)}
			>
				<option value="">{t.booking_destination_placeholder || 'Select your destination'}</option>
				{#each STAGES as stage}
					<option value={stage.id}>{stage.name}</option>
				{/each}
			</select>
			{#if fieldErrors.destination}
				<span class="error-message modern-error">{fieldErrors.destination}</span>
			{/if}
		</div>

		<div class="form-group modern-group">
			<label for="bags" class="form-label modern-label">{t.booking_bags_label}</label>
			<input
				type="number"
				id="bags"
				class="form-input modern-input"
				class:error={fieldErrors.bags}
				placeholder={t.booking_bags_placeholder}
				min="0"
				bind:value={aboutTrip.bags}
				onblur={() => validateField('bags', aboutTrip.bags)}
			/>
			{#if fieldErrors.bags}
				<span class="error-message modern-error">{fieldErrors.bags}</span>
			{/if}
		</div>

		{#if route && route.length > 0 && aboutTrip.departureDate}
			<div class="itinerary-container">
				<h4 class="itinerary-title">{t.booking_itinerary_title}</h4>
				<table class="itinerary-table">
					<thead>
						<tr>
							<th>{t.booking_itinerary_day}</th>
							<th>Date</th>
							<th>Segment</th>
						</tr>
					</thead>
					<tbody>
						{#each route as [from, to], i}
							<tr>
								<td>{t.booking_itinerary_day} {i + 1}</td>
								<td>{formatDate(aboutTrip.departureDate, i)}</td>
								<td>{stageNames[from]} → {stageNames[to]}</td>
							</tr>
						{/each}
					</tbody>
				</table>
				<div class="itinerary-summary">
					Total duration: {route.length} days of walking.
				</div>

				{#if priceBreakdown}
					<div class="price-breakdown">
						<h4 class="price-title">{t.booking_price_title || 'Price Breakdown'}</h4>
						<div class="price-explanation">
							<p>{t.booking_price_explanation || 'Our pricing is based on the number of transfers and luggage pieces:'}</p>
							<ul>
								<li>{t.booking_price_rule_1 || '4 or more transfers: 15€ per transfer'}</li>
								<li>{t.booking_price_rule_2 || 'Up to 3 transfers: 20€ per transfer'}</li>
								<li>{t.booking_price_rule_3 || 'Rate includes up to 2 luggage pieces per transfer'}</li>
								<li>{t.booking_price_rule_4 || 'Each additional piece per transfer: 5€'}</li>
							</ul>
						</div>
						<div class="price-details">
							<div class="price-line">
								<span class="price-label">{priceBreakdown.numTransfers} {t.booking_price_transfers || 'transfers'} × {priceBreakdown.pricePerTransfer}€:</span>
								<span class="price-value">{priceBreakdown.baseCost}€</span>
							</div>
							{#if priceBreakdown.additionalBags > 0}
								<div class="price-line">
									<span class="price-label">{priceBreakdown.additionalBags} {t.booking_price_additional_bags || 'additional bags'} × {priceBreakdown.numTransfers} {t.booking_price_transfers || 'transfers'} × 5€:</span>
									<span class="price-value">{priceBreakdown.additionalBagsCost}€</span>
								</div>
							{/if}
							<div class="price-total">
								<span class="price-label">{t.booking_price_total || 'Total:'}</span>
								<span class="price-value">{priceBreakdown.totalCost}€</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else if aboutTrip.departure && aboutTrip.destination && aboutTrip.departure === aboutTrip.destination}
			<p class="error-message" style="text-align: center; margin-top: 1rem;">
				Start and destination cannot be the same town.
			</p>
		{:else}
			<div class="itinerary-placeholder">
				<p>Select your start point, destination, and date to generate your itinerary.</p>
			</div>
		{/if}
	</form>
</div>

<style>
	.booking-step {
		min-height: 300px;
	}

	.step-title {
		font-size: 1.8rem;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.booking-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Modern styling */
	.basic-details-modern .modern-form {
		background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
		padding: 2.5rem;
		border-radius: 16px;
		border: 1px solid #e9ecef;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.modern-group {
		margin-bottom: 1.75rem;
	}

	.modern-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #495057;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.5rem;
	}

	.modern-input {
		padding: 1rem 1.25rem;
		border: 1.5px solid #dee2e6;
		border-radius: 10px;
		font-size: 1rem;
		background: #ffffff;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
		width: 100%;
		font-family: inherit;
	}

	.modern-input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.modern-input.error {
		border-color: #dc3545;
		box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
	}

	.modern-error {
		color: #dc3545;
		font-size: 0.8125rem;
		margin-top: 0.5rem;
		font-weight: 500;
	}

	/* Itinerary styles */
	.itinerary-container {
		margin-top: 2rem;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}

	.itinerary-title {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #333;
	}

	.itinerary-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
		background: white;
		border-radius: 8px;
		overflow: hidden;
	}

	.itinerary-table thead {
		background: #007bff;
		color: white;
	}

	.itinerary-table th {
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
	}

	.itinerary-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.itinerary-table tbody tr:last-child td {
		border-bottom: none;
	}

	.itinerary-table tbody tr:hover {
		background: #f8f9fa;
	}

	.itinerary-summary {
		font-weight: 600;
		color: #333;
		text-align: center;
		padding-top: 1rem;
		border-top: 1px solid #e0e0e0;
	}

	.itinerary-placeholder {
		margin-top: 2rem;
		padding: 2rem;
		text-align: center;
		background: #f8f9fa;
		border: 2px dashed #e0e0e0;
		border-radius: 8px;
		color: #666;
	}

	/* Price Breakdown Styles */
	.price-breakdown {
		margin-top: 2rem;
		padding: 1.5rem;
		background: #f0f7ff;
		border: 2px solid #007bff;
		border-radius: 8px;
	}

	.price-title {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #007bff;
	}

	.price-explanation {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: white;
		border-radius: 6px;
	}

	.price-explanation p {
		margin: 0 0 0.75rem 0;
		font-weight: 600;
		color: #333;
	}

	.price-explanation ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #555;
	}

	.price-explanation li {
		margin: 0.5rem 0;
		line-height: 1.5;
	}

	.price-details {
		background: white;
		padding: 1rem;
		border-radius: 6px;
	}

	.price-line {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e0e0e0;
	}

	.price-line:last-of-type {
		border-bottom: none;
	}

	.price-label {
		color: #666;
	}

	.price-value {
		font-weight: 600;
		color: #333;
	}

	.price-total {
		display: flex;
		justify-content: space-between;
		padding: 1rem 0 0.5rem 0;
		margin-top: 0.5rem;
		border-top: 2px solid #007bff;
		font-size: 1.1rem;
	}

	.price-total .price-label {
		font-weight: 600;
		color: #007bff;
	}

	.price-total .price-value {
		font-size: 1.3rem;
		font-weight: 700;
		color: #007bff;
	}

	@media (max-width: 768px) {
		.basic-details-modern .modern-form {
			padding: 1.5rem;
		}

		.itinerary-table {
			font-size: 0.875rem;
		}

		.itinerary-table th,
		.itinerary-table td {
			padding: 0.5rem;
		}
	}
</style>

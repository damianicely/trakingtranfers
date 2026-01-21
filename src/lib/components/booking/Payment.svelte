<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, formatDate, type Stage } from '$lib/trail';
	import { onMount } from 'svelte';

	let { formData, route } = $props<{
		formData: Record<string, any>;
		route: [string, string][] | null;
	}>();

	console.log('[Payment] Component mounted');
	console.log('[Payment] formData:', formData);
	console.log('[Payment] route:', route);

	const t = $derived(translations[$language || 'en'] || translations.en);

	onMount(() => {
		console.log('[Payment] onMount - formData:', formData);
		console.log('[Payment] onMount - route:', route);
		console.log('[Payment] onMount - language:', $language);
		console.log('[Payment] onMount - t:', t);
	});

	// Payment state - use $state() for reactivity in runes mode
	let paymentProcessing = $state(false);
	let paymentError = $state<string | null>(null);

	// Stage names mapping
	const stageNames = Object.fromEntries(STAGES.map((s: Stage) => [s.id, s.name]));

	// Calculate price using same logic as Route component
	const calculatePrice = $derived.by(() => {
		const currentFormData = formData;
		const currentRoute = route;
		const aboutTrip = currentFormData?.aboutTrip || {};
		if (!currentRoute || currentRoute.length === 0 || !aboutTrip.bags) {
			return null;
		}
		
		const bagsStr = String(aboutTrip.bags).trim();
		if (!bagsStr || bagsStr === '0') {
			return null;
		}

		const numTransfers = currentRoute.length;
		const numBags = parseInt(bagsStr, 10);

		if (!numBags || numBags <= 0 || isNaN(numBags)) {
			return null;
		}

		// Base price per transfer
		const pricePerTransfer = numTransfers >= 4 ? 15 : 20;
		
		// Base cost (includes up to 2 bags per transfer)
		const baseCost = numTransfers * pricePerTransfer;
		
		// Additional bags cost (bags beyond 2, per transfer)
		const additionalBags = Math.max(0, numBags - 2);
		const additionalBagsCost = numTransfers * additionalBags * 5;
		
		const totalCost = baseCost + additionalBagsCost;

		return totalCost;
	});

	// Reactive booking summary
	const summary = $derived.by(() => {
		const currentFormData = formData;
		const currentRoute = route;
		console.log('[Payment] Computing summary - formData:', currentFormData, 'route:', currentRoute);
		
		const aboutTrip = currentFormData?.aboutTrip || {};
		const departureDate = aboutTrip.departureDate || '';
		
		// Generate transfer list with dates
		const transfers: Array<{ date: string; dateFormatted: string; from: string; to: string }> = [];
		
		if (currentRoute && currentRoute.length > 0 && departureDate) {
			currentRoute.forEach(([from, to], index) => {
				const dateFormatted = formatDate(departureDate, index);
				transfers.push({
					date: departureDate,
					dateFormatted,
					from: stageNames[from] || from,
					to: stageNames[to] || to
				});
			});
		}
		
		const totalPrice = calculatePrice;
		
		const result = {
			transfers,
			totalPrice
		};
		console.log('[Payment] Summary result:', result);
		return result;
	});

	async function handlePayment() {
		console.log('[Payment] handlePayment called');
		console.log('[Payment] Current formData:', formData);
		console.log('[Payment] Current route:', route);
		
		paymentProcessing = true;
		paymentError = null;

		try {
			// Calculate the total price
			const totalPrice = calculatePrice;
			console.log('[Payment] Calculated price:', totalPrice);
			
			if (!totalPrice || totalPrice <= 0) {
				console.error('[Payment] Invalid price:', totalPrice);
				paymentError = 'Invalid price. Please complete the booking form.';
				paymentProcessing = false;
				return;
			}

			// Create form data to submit to the createCheckout action
			const formDataToSubmit = new FormData();
			formDataToSubmit.append('amount', totalPrice.toString());
			// Include booking payload so server can persist details & segments
			const bookingPayload = {
				basicDetails: formData.basicDetails,
				aboutTrip: formData.aboutTrip,
				route
			};
			formDataToSubmit.append('bookingPayload', JSON.stringify(bookingPayload));
			console.log('[Payment] Submitting amount:', totalPrice.toString(), 'bookingPayload:', bookingPayload);

			// Call the createCheckout action (SvelteKit named action format)
			console.log('[Payment] Calling fetch to /?/createCheckout');
			const response = await fetch('/?/createCheckout', {
				method: 'POST',
				headers: {
					'accept': 'application/json'
				},
				body: formDataToSubmit
			});
			console.log('[Payment] Response status:', response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { message: errorText || `Server returned ${response.status}` };
				}
				throw new Error(errorData.message || `Server returned ${response.status}`);
			}

			// SvelteKit form actions return JSON with the result nested
			const result = await response.json();
			console.log('[Payment] Action response:', result);
			
			// The response format is: { type: 'success', status: 200, data: '[...]' }
			// Where data is a JSON string containing an array
			let checkoutUrl: string | null = null;
			
			if (result.data) {
				// Parse the data field (it's a JSON string)
				const parsedData = JSON.parse(result.data);
				console.log('[Payment] Parsed data:', parsedData);
				
				// The URL is at index 1 of the array
				if (Array.isArray(parsedData) && parsedData.length > 1) {
					checkoutUrl = parsedData[1];
				} else if (parsedData && typeof parsedData === 'object' && parsedData.url) {
					// Fallback: if it's an object with a url property
					checkoutUrl = parsedData.url;
				}
			}
			
			if (checkoutUrl && typeof checkoutUrl === 'string') {
				console.log('[Payment] Redirecting to:', checkoutUrl);
				// Redirect to Stripe Checkout
				window.location.href = checkoutUrl;
			} else {
				console.error('[Payment] Could not extract URL from response:', result);
				throw new Error('No checkout URL received from server');
			}
		} catch (error: any) {
			paymentError = error.message || t.booking_payment_error;
			paymentProcessing = false;
		}
	}
</script>

<!-- DEBUG: Payment component rendering -->
<div class="booking-step basic-details-modern">
	<h3 class="step-title">DEBUG: Payment Step - {t.booking_step_payment_title || 'Payment'}</h3>
	<p style="color: red; font-weight: bold;">DEBUG: formData keys: {formData ? Object.keys(formData).join(', ') : 'formData is null'}</p>
	<p style="color: red; font-weight: bold;">DEBUG: route: {route ? JSON.stringify(route) : 'route is null'}</p>
	<p style="color: red; font-weight: bold;">DEBUG: summary: {summary ? JSON.stringify(summary) : 'summary is null'}</p>
	
	<div class="modern-form">
		<div class="payment-container">
				<!-- Booking Summary -->
				<div class="booking-summary">
					<h4 class="summary-title">{t.booking_payment_summary_title}</h4>
					
					{#if summary.transfers.length > 0}
						<div class="transfers-list">
							<h5 class="transfers-title">{t.booking_payment_transfers_title || 'Transfers'}</h5>
							{#each summary.transfers as transfer, index}
								<div class="transfer-item">
									<span class="transfer-date">{transfer.dateFormatted}</span>
									<span class="transfer-route">{transfer.from} → {transfer.to}</span>
								</div>
							{/each}
						</div>
					{/if}
					
					{#if summary.totalPrice !== null}
						<div class="summary-total">
							<span class="summary-label">{t.booking_price_total || 'Total:'}</span>
							<span class="summary-value">{summary.totalPrice}€</span>
						</div>
					{/if}
				</div>

				<!-- Payment Section -->
				<div class="payment-form-section">
					<h4 class="payment-form-title">{t.booking_payment_card_title}</h4>
					
					{#if paymentError}
						<div class="payment-error-message">
							{paymentError}
						</div>
					{/if}

					<div class="payment-info">
						<p>Click the button below to proceed to secure payment. You'll be redirected to Stripe Checkout to complete your booking.</p>
					</div>

					<div class="payment-actions">
						<button
							type="button"
							class="payment-button"
							onclick={() => {
								console.log('[Payment] Button clicked!');
								handlePayment();
							}}
							disabled={paymentProcessing}
						>
							{#if paymentProcessing}
								{t.booking_payment_processing}
							{:else}
								{t.booking_payment_button}
							{/if}
						</button>
						<p style="color: blue; font-size: 0.8rem; margin-top: 0.5rem;">
							DEBUG: paymentProcessing={String(paymentProcessing)}, paymentError={paymentError || 'null'}
						</p>
					</div>

					<div class="payment-note">
						<p>🔒 Your payment is secure and encrypted. We use Stripe to process all payments.</p>
						<p><strong>For testing:</strong> Use card number <code>4242 4242 4242 4242</code>, any future expiry date, any CVC, and any postal code.</p>
					</div>
				</div>
			</div>
	</div>
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

	/* Flat design styling */
	.basic-details-modern .modern-form {
		background: transparent;
		padding: 0;
	}

	/* Payment Section Styles - flat design */
	.payment-container {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.booking-summary {
		background: transparent;
		padding: 0;
	}

	.summary-title {
		font-size: 1.3rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.transfers-list {
		margin-bottom: 2rem;
	}

	.transfers-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #333;
	}

	.transfer-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		margin-bottom: 0.5rem;
		background: transparent;
		border-bottom: 1px solid #e0e0e0;
	}

	.transfer-item:last-child {
		border-bottom: none;
	}

	.transfer-date {
		font-weight: 600;
		color: #333;
		min-width: 120px;
	}

	.transfer-route {
		color: #666;
		font-weight: 500;
	}

	.summary-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 0;
		margin-top: 1rem;
		border-top: 2px solid #333;
		font-size: 1.2rem;
	}

	.summary-label {
		font-weight: 600;
		color: #333;
	}

	.summary-value {
		color: #333;
		font-weight: 700;
		font-size: 1.4rem;
	}

	.payment-form-section {
		background: transparent;
		padding: 0;
	}

	.payment-form-title {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.payment-info {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		color: #666;
	}

	.payment-info p {
		margin: 0;
		line-height: 1.6;
	}

	.payment-actions {
		margin-top: 1.5rem;
	}

	.payment-button {
		width: 100%;
		padding: 1rem;
		font-size: 1.1rem;
		font-weight: 600;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
	}

	.payment-button:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.payment-button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.payment-success {
		text-align: center;
		padding: 2rem 0;
		background: transparent;
		color: #28a745;
		font-weight: 600;
	}

	.success-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.payment-success h4 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.payment-error-message {
		background: transparent;
		color: #dc3545;
		padding: 1rem 0;
		margin-bottom: 1rem;
		font-weight: 500;
	}

	.payment-note {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		font-size: 0.9rem;
		color: #666;
	}

	.payment-note p {
		margin: 0.5rem 0;
	}

	.payment-note code {
		background: #e9ecef;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: monospace;
	}

	@media (max-width: 768px) {
		.basic-details-modern .modern-form {
			padding: 1.5rem;
		}

		.payment-container {
			gap: 1.5rem;
		}

		.booking-summary,
		.payment-form-section {
			padding: 1rem;
		}
	}
</style>

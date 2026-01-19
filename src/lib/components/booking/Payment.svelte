<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, formatDate, type Stage } from '$lib/trail';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	$: t = translations[$language || 'en'] || translations.en;

	export let formData: Record<string, any> = {
		basicDetails: { bags: '' },
		aboutTrip: { departure: '', destination: '', departureDate: '' }
	};

	export let route: [string, string][] | null = null;

	// Stripe payment state
	const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SpqLL6iYKZWJHuzVhpIYqd7WqeI4zXy6yzqWEw8D5dIDjdJKqYeRAJ5x9RItSVbbXExhKrtrI3wPQEI50016GAr00ZPCgGAPy';
	let stripe: any = null;
	let elements: any = null;
	let paymentElement: any = null;
	let paymentProcessing = false;
	let paymentError: string | null = null;
	let paymentSuccess = false;
	let paymentIntentClientSecret: string | null = null;

	// Stage names mapping
	const stageNames = Object.fromEntries(STAGES.map((s: Stage) => [s.id, s.name]));

	// Calculate price using same logic as Route component
	const calculatePrice = () => {
		const aboutTrip = formData?.aboutTrip || {};
		if (!route || route.length === 0 || !aboutTrip.bags) {
			return null;
		}
		
		const bagsStr = String(aboutTrip.bags).trim();
		if (!bagsStr || bagsStr === '0') {
			return null;
		}

		const numTransfers = route.length;
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
	};

	// Helper function to get booking summary with transfers and price
	const getBookingSummary = () => {
		const aboutTrip = formData?.aboutTrip || {};
		const departureDate = aboutTrip.departureDate || '';
		
		// Generate transfer list with dates
		const transfers: Array<{ date: string; dateFormatted: string; from: string; to: string }> = [];
		
		if (route && route.length > 0 && departureDate) {
			route.forEach(([from, to], index) => {
				const dateFormatted = formatDate(departureDate, index);
				transfers.push({
					date: departureDate,
					dateFormatted,
					from: stageNames[from] || from,
					to: stageNames[to] || to
				});
			});
		}
		
		const totalPrice = calculatePrice();
		
		return {
			transfers,
			totalPrice
		};
	};

	// Initialize Stripe when component mounts
	onMount(() => {
		if (browser) {
			// Wait for Stripe.js to load and DOM to be ready
			if (typeof window !== 'undefined' && (window as any).Stripe) {
				setTimeout(() => {
					initializeStripe();
				}, 100); // Small delay to ensure DOM is ready
			}
		}
	});

	async function initializeStripe() {
		if (stripe || !browser) {
			return; // Already initialized or not in browser
		}

		try {
			// Wait for Stripe.js to be available
			if (typeof window === 'undefined' || !(window as any).Stripe) {
				return;
			}

			// Initialize Stripe
			stripe = (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
			
			// Wait for payment element container to exist
			const paymentElementContainer = document.getElementById('payment-element');
			
			if (!paymentElementContainer) {
				return;
			}
			
			// Try to create payment intent from backend first
			try {
				// Calculate the actual price from form data
				const totalPrice = calculatePrice();
				if (!totalPrice || totalPrice <= 0) {
					throw new Error('Invalid price. Please complete the booking form.');
				}
				
				// Convert EUR to cents (Stripe requires amounts in smallest currency unit)
				const amountInCents = Math.round(totalPrice * 100);
				
				const response = await fetch('/api/create-payment-intent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						amount: amountInCents, 
						currency: 'eur' 
					})
				});

				if (response.ok) {
					const data = await response.json();
					paymentIntentClientSecret = data.clientSecret;
				} else {
					throw new Error(`Backend returned ${response.status}`);
				}
			} catch (backendError: any) {
				// For testing without backend, we'll create Elements without clientSecret
				// This allows the Payment Element to mount, but payment will need backend
				paymentIntentClientSecret = null;
			}
			
			// Create Elements instance
			// If we have a client secret, use it. Otherwise, create Elements without it (for testing UI)
			const elementsOptions: any = {
				appearance: {
					theme: 'stripe',
					variables: {
						colorPrimary: '#007bff',
						colorBackground: '#ffffff',
						colorText: '#333333',
						colorDanger: '#df1b41',
						fontFamily: 'system-ui, sans-serif',
						spacingUnit: '4px',
						borderRadius: '8px'
					}
				}
			};

			if (paymentIntentClientSecret) {
				elementsOptions.clientSecret = paymentIntentClientSecret;
			}

			elements = stripe.elements(elementsOptions);

			// Create and mount Payment Element
			paymentElement = elements.create('payment');
			
			try {
				paymentElement.mount('#payment-element');
			} catch (mountError: any) {
				paymentError = `Failed to mount payment form: ${mountError.message}`;
			}
		} catch (error: any) {
			paymentError = error.message || 'Failed to initialize payment system. Please refresh the page.';
		}
	}

	async function handlePayment() {
		if (!stripe || !paymentElement || !elements) {
			paymentError = 'Payment system not ready. Please refresh the page.';
			return;
		}

		paymentProcessing = true;
		paymentError = null;

		try {
			// STEP 1: Immediately validate the payment form (REQUIRED by Stripe)
			// This must be called BEFORE any async work
			const { error: submitError } = await elements.submit();
			
			if (submitError) {
				paymentError = submitError.message || 'Please check your payment details.';
				paymentProcessing = false;
				return;
			}

			// STEP 2: Now we can do async work (create payment intent if needed)
			if (!paymentIntentClientSecret) {
				// Calculate the actual price from form data
				const totalPrice = calculatePrice();
				if (!totalPrice || totalPrice <= 0) {
					paymentError = 'Invalid price. Please complete the booking form.';
					paymentProcessing = false;
					return;
				}
				
				// Convert EUR to cents (Stripe requires amounts in smallest currency unit)
				const amountInCents = Math.round(totalPrice * 100);
				
				const response = await fetch('/api/create-payment-intent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						amount: amountInCents, 
						currency: 'eur' 
					})
				});

				if (!response.ok) {
					throw new Error(`Backend returned ${response.status}. Please check your server.`);
				}

				const data = await response.json();
				if (data.error) {
					throw new Error(data.error);
				}
				
				paymentIntentClientSecret = data.clientSecret;
			}

			// STEP 3: Confirm the payment with Stripe
			const { error: confirmError } = await stripe.confirmPayment({
				elements,
				clientSecret: paymentIntentClientSecret,
				confirmParams: {
					return_url: `${window.location.origin}/booking-success`
				},
				redirect: 'if_required'
			});

			if (confirmError) {
				paymentError = confirmError.message || t.booking_payment_error;
				paymentProcessing = false;
			} else {
				// Payment succeeded
				paymentSuccess = true;
				paymentProcessing = false;
				// You can redirect or show success message here
			}
		} catch (error: any) {
			paymentError = error.message || t.booking_payment_error;
			paymentProcessing = false;
		}
	}
</script>

<div class="booking-step basic-details-modern">
	<h3 class="step-title">{t.booking_step_payment_title}</h3>
	
	<div class="modern-form">
		{#if paymentSuccess}
			<div class="payment-success">
				<div class="success-icon">✓</div>
				<h4>{t.booking_payment_success}</h4>
				<p>Your booking has been confirmed. We'll send you a confirmation email shortly.</p>
			</div>
		{:else}
			{@const summary = getBookingSummary()}
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

				<!-- Payment Form -->
				<div class="payment-form-section">
					<h4 class="payment-form-title">{t.booking_payment_card_title}</h4>
					
					{#if paymentError}
						<div class="payment-error-message">
							{paymentError}
						</div>
					{/if}

					<div id="payment-element" class="stripe-payment-element">
						<!-- Stripe Payment Element will be mounted here -->
						{#if !paymentElement}
							<div class="payment-loading">
								<p>Loading payment form...</p>
							</div>
						{/if}
					</div>

					<div class="payment-actions">
						<button
							type="button"
							class="payment-button"
							onclick={handlePayment}
							disabled={paymentProcessing || !stripe || !paymentElement}
						>
							{#if paymentProcessing}
								{t.booking_payment_processing}
							{:else}
								{t.booking_payment_button}
							{/if}
						</button>
					</div>

					<div class="payment-note">
						<p>🔒 Your payment is secure and encrypted. We use Stripe to process all payments.</p>
						<p><strong>For testing:</strong> Use card number <code>4242 4242 4242 4242</code>, any future expiry date, any CVC, and any postal code.</p>
					</div>
				</div>
			</div>
		{/if}
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

	.stripe-payment-element {
		margin-bottom: 1.5rem;
		padding: 0;
		background: transparent;
	}

	.payment-loading {
		text-align: center;
		padding: 2rem;
		color: #666;
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

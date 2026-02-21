<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, generateRoute, formatDate, type Stage } from '$lib/trail';
	import { browser } from '$app/environment';
	import BasicDetailsStep from './booking/BasicDetailsStep.svelte';
	import Route from './booking/Route.svelte';
	import { calculateBookingPrice } from '$lib/booking/price';

	$: t = translations[$language];

	// Booking form state management
	let currentStep = 1;
	let formData: Record<string, any> = {
		basicDetails: {
			firstName: '',
			lastName: '',
			bookingNames: '',
			email: '',
			phone: ''
		},
		aboutTrip: {
			departure: '',
			destination: '',
			departureDate: '',
			bags: ''
		},
		itinerary: null as Array<{ day: number; from: string; to: string }> | null,
		accommodation: {
			provideLater: false,
			hotels: [] as Array<{
				nightIndex: number;
				locationId: string;
				locationName: string;
				checkInDate: string;
				checkInDateFormatted: string;
				name: string;
				address: string;
			}>
		}
	};
	let completedSteps: number[] = [];
	let fieldErrors: Record<string, string> = {};
	let paymentProcessing = false;
	let paymentError: string | null = null;
	let availabilityError: string | null = null;
	let emailCheckDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	$: calculatedPrice = calculateBookingPrice(route, formData.aboutTrip?.bags);

	async function checkEmailWithServer(): Promise<boolean> {
		const email = (formData.basicDetails?.email || '').toString().trim();
		if (!email) return true;
		try {
			const res = await fetch('/api/booking/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'email', email })
			});
			const data = await res.json().catch(() => ({}));
			if (res.status === 429) {
				fieldErrors = { ...fieldErrors, email: data.message || 'Too many requests. Please try again later.' };
				return false;
			}
			if (data.ok === false && data.message) {
				fieldErrors = { ...fieldErrors, email: data.message };
				return false;
			}
			const { email: _e, ...rest } = fieldErrors;
			fieldErrors = rest;
			return true;
		} catch (_) {
			fieldErrors = { ...fieldErrors, email: 'Could not verify email. Please try again.' };
			return false;
		}
	}

	function scheduleEmailCheck() {
		if (emailCheckDebounceTimer) clearTimeout(emailCheckDebounceTimer);
		emailCheckDebounceTimer = setTimeout(() => {
			emailCheckDebounceTimer = null;
			checkEmailWithServer();
		}, 400);
	}

	async function checkAvailabilityWithServer(): Promise<boolean> {
		const departureDate = (formData.aboutTrip?.departureDate || '').toString().trim();
		if (!departureDate || !route || route.length === 0) {
			availabilityError = null;
			return true;
		}
		try {
			const res = await fetch('/api/booking/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'availability', departureDate, route })
			});
			const data = await res.json().catch(() => ({}));
			if (res.status === 429) {
				availabilityError = data.message || 'Too many requests. Please try again later.';
				return false;
			}
			if (data.ok === false && data.message) {
				availabilityError = data.message;
				return false;
			}
			availabilityError = null;
			return true;
		} catch (_) {
			availabilityError = 'Could not check availability. Please try again.';
			return false;
		}
	}


	// Map stage IDs to names for display
	const stageNames = Object.fromEntries(STAGES.map((s: Stage) => [s.id, s.name]));

	// Generate route using generateRoute from trail.ts
	// Use reactive statement with explicit dependencies so Svelte tracks changes
	$: route = (() => {
		if (!formData.aboutTrip.departure || !formData.aboutTrip.destination) {
			return null;
		}

		const startId = formData.aboutTrip.departure;
		const endId = formData.aboutTrip.destination;

		if (startId === endId) {
			return null;
		}

		return generateRoute(startId, endId);
	})();

	// Calculate travel dates based on departure date and route length
	const getTravelDates = (): Array<{ day: number; date: string; dateFormatted: string }> | null => {
		if (!formData.aboutTrip.departureDate || !route || route.length === 0) {
			return null;
		}

		const departureDate = formData.aboutTrip.departureDate;
		const numDays = route.length;

		const dates: Array<{ day: number; date: string; dateFormatted: string }> = [];
		
		for (let day = 0; day <= numDays; day++) {
			const dateFormatted = formatDate(departureDate, day);
			const currentDate = new Date(departureDate);
			currentDate.setDate(currentDate.getDate() + day);
			const dateStr = currentDate.toISOString().split('T')[0];
			dates.push({
				day,
				date: dateStr,
				dateFormatted
			});
		}

		return dates;
	};

	$: travelDates = getTravelDates();

	// Reactive: Generate hotels when route/departureDate changes
	// IMPORTANT: Directly reference dependencies so Svelte tracks them
	$: generatedHotels = (() => {
		// Extract dependencies to top level for reactivity
		const currentRoute = route;
		const currentDepartureDate = formData.aboutTrip.departureDate;

		if (!currentRoute || currentRoute.length === 0 || !currentDepartureDate) {
			return null;
		}

		const hotels: Array<{
			nightIndex: number;
			locationId: string;
			locationName: string;
			checkInDate: string;
			checkInDateFormatted: string;
			name: string;
			address: string;
		}> = [];

		// Night 0: Starting location (first segment's start point) - Departure Date
		const startLocationId = currentRoute[0][0];
		const startDate = new Date(currentDepartureDate);
		const startDateStr = startDate.toISOString().split('T')[0];
		hotels.push({
			nightIndex: 0,
			locationId: startLocationId,
			locationName: stageNames[startLocationId] || startLocationId,
			checkInDate: startDateStr,
			checkInDateFormatted: formatDate(currentDepartureDate, 0),
			name: '',
			address: ''
		});

		// Nights 1+: Each segment's destination
		// Hotel 2 (nightIndex 1) should have the same date as departure date
		// Hotel 3+ (nightIndex 2+) should increment from there
		currentRoute.forEach(([from, to]: [string, string], index: number) => {
			const nightIndex = index + 1;
			const checkInDate = new Date(currentDepartureDate);
			// For nightIndex 1 (second hotel), use departure date (same as first hotel)
			// For nightIndex 2+, add (nightIndex - 1) days so hotel 3 = departure + 1, hotel 4 = departure + 2, etc.
			if (nightIndex === 1) {
				// Second hotel: same date as departure (day 0)
				checkInDate.setDate(checkInDate.getDate());
			} else {
				// Third hotel onwards: departure + (nightIndex - 1) days
				checkInDate.setDate(checkInDate.getDate() + (nightIndex - 1));
			}
			const checkInDateStr = checkInDate.toISOString().split('T')[0];
			hotels.push({
				nightIndex: nightIndex,
				locationId: to,
				locationName: stageNames[to] || to,
				checkInDate: checkInDateStr,
				checkInDateFormatted: formatDate(currentDepartureDate, nightIndex === 1 ? 0 : (nightIndex - 1)),
				name: '',
				address: ''
			});
		});

		return hotels;
	})();

	// Reactive: Populate/update accommodation.hotels when generatedHotels changes
	$: {
		if (generatedHotels && generatedHotels.length > 0) {
			if (formData.accommodation.hotels.length === 0) {
				// First time: populate with generated structure
				formData.accommodation.hotels = generatedHotels;
			} else if (formData.accommodation.hotels.length !== generatedHotels.length) {
			// Route changed: regenerate but try to preserve user input where possible
			formData.accommodation.hotels = generatedHotels.map((newHotel: {
				nightIndex: number;
				locationId: string;
				locationName: string;
				checkInDate: string;
				checkInDateFormatted: string;
				name: string;
				address: string;
			}) => {
				const existing = formData.accommodation.hotels.find(
					(h: { nightIndex: number; locationId: string }) => h.nightIndex === newHotel.nightIndex && h.locationId === newHotel.locationId
				);
				return existing
					? {
							...newHotel,
							name: existing.name,
							address: existing.address
						}
					: newHotel;
			});
		} else {
			// Same length: update metadata (location, dates) but keep user input
			formData.accommodation.hotels = formData.accommodation.hotels.map((existing: {
				nightIndex: number;
				locationId: string;
				locationName: string;
				checkInDate: string;
				checkInDateFormatted: string;
				name: string;
				address: string;
			}, i: number) => ({
				...generatedHotels[i],
				name: existing.name,
				address: existing.address
			}));
			}
		} else if (!generatedHotels) {
			// Route cleared: clear hotels
			formData.accommodation.hotels = [];
		}
	}

	const validateAccommodation = (): boolean => {
		// If providing later, no validation needed
		if (formData.accommodation.provideLater) {
			return true;
		}

		// Otherwise, all hotels must have name and contact
		if (!formData.accommodation.hotels || formData.accommodation.hotels.length === 0) {
			return false;
		}

		const errors: Record<string, string> = {};
		formData.accommodation.hotels.forEach((hotel: {
			nightIndex: number;
			locationId: string;
			locationName: string;
			checkInDate: string;
			checkInDateFormatted: string;
			name: string;
			address: string;
		}, index: number) => {
			if (!hotel.name.trim()) {
				errors[`hotel_${index}_name`] = t.booking_hotel_name_error;
			}
			if (!hotel.address.trim()) {
				errors[`hotel_${index}_contact`] = t.booking_hotel_contact_error;
			}
		});

		fieldErrors = { ...fieldErrors, ...errors };
		return Object.keys(errors).length === 0;
	};

	// Date validation and blocking logic
	const getTomorrowDate = (): string => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	};

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

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const validateBasicDetails = (): boolean => {
		const errors: Record<string, string> = {};
		const { firstName, lastName, email, phone } = formData.basicDetails;

		if (!firstName.trim()) {
			errors.firstName = t.booking_first_name_error;
		}

		if (!lastName.trim()) {
			errors.lastName = t.booking_last_name_error;
		}

		if (!email.trim()) {
			errors.email = t.booking_email_error;
		} else if (!validateEmail(email)) {
			errors.email = t.booking_email_error;
		}

		if (!phone.trim()) {
			errors.phone = t.booking_phone_error;
		}

		fieldErrors = { ...fieldErrors, ...errors };
		return Object.keys(errors).length === 0;
	};

	const validateField = (fieldName: string, value: string) => {
		const errors: Record<string, string> = { ...fieldErrors };

		switch (fieldName) {
			case 'firstName':
				if (!value.trim()) {
					errors.firstName = t.booking_first_name_error;
				} else {
					delete errors.firstName;
				}
				break;
			case 'lastName':
				if (!value.trim()) {
					errors.lastName = t.booking_last_name_error;
				} else {
					delete errors.lastName;
				}
				break;
			case 'email':
				if (!value.trim()) {
					errors.email = t.booking_email_error;
				} else if (!validateEmail(value)) {
					errors.email = t.booking_email_error;
				} else {
					delete errors.email;
				}
				break;
			case 'phone':
				if (!value.trim()) {
					errors.phone = t.booking_phone_error;
				} else {
					delete errors.phone;
				}
				break;
			case 'bags':
				if (!value || Number(value) < 0) {
					errors.bags = t.booking_bags_error;
				} else {
					delete errors.bags;
				}
				break;
			case 'departure':
				if (!value.trim()) {
					errors.departure = t.booking_departure_error;
				} else {
					delete errors.departure;
				}
				break;
			case 'destination':
				if (!value.trim()) {
					errors.destination = t.booking_destination_error || 'Destination is required';
				} else if (formData.aboutTrip.departure && value === formData.aboutTrip.departure) {
					errors.destination = t.booking_destination_same_error || 'Start and destination cannot be the same';
				} else {
					delete errors.destination;
				}
				break;
			case 'departureDate':
				if (!value.trim()) {
					errors.departureDate = t.booking_departure_date_error;
				} else {
					const selectedDate = new Date(value);
					const tomorrow = new Date();
					tomorrow.setDate(tomorrow.getDate() + 1);
					tomorrow.setHours(0, 0, 0, 0);
					selectedDate.setHours(0, 0, 0, 0);
					
					if (selectedDate < tomorrow) {
						errors.departureDate = t.booking_departure_date_min_error;
					} else if (isDateBlocked(value)) {
						errors.departureDate = t.booking_departure_date_blocked;
					} else {
						delete errors.departureDate;
					}
				}
				break;
		}

		fieldErrors = errors;
	};

	const validateAboutTrip = (): boolean => {
		const errors: Record<string, string> = {};
		const { departure, destination, departureDate, bags } = formData.aboutTrip;

		if (!departure.trim()) {
			errors.departure = t.booking_departure_error;
		}

		if (!destination.trim()) {
			errors.destination = t.booking_destination_error || 'Destination is required';
		}

		if (departure && destination && departure === destination) {
			errors.destination = t.booking_destination_same_error || 'Start and destination cannot be the same';
		}

		if (!departureDate.trim()) {
			errors.departureDate = t.booking_departure_date_error;
		}

		if (!bags || Number(bags) < 0) {
			errors.bags = t.booking_bags_error;
		}

		fieldErrors = { ...fieldErrors, ...errors };
		return Object.keys(errors).length === 0;
	};

	const handleNext = () => {
		if (currentStep === 1) {
			if (validateBasicDetails()) {
				if (!completedSteps.includes(1)) {
					completedSteps = [...completedSteps, 1];
				}
				nextStep();
			}
		} else if (currentStep === 2) {
			if (validateAboutTrip()) {
				if (route) {
					formData.itinerary = route;
				}
				if (!completedSteps.includes(2)) {
					completedSteps = [...completedSteps, 2];
				}
				handlePayNow();
			}
		}
	};

	async function handlePayNow() {
		if (!validateBasicDetails() || !validateAboutTrip()) return;
		paymentError = null;
		availabilityError = null;
		const emailOk = await checkEmailWithServer();
		if (!emailOk) {
			paymentError = fieldErrors.email || 'Please fix the email error above.';
			return;
		}
		const availabilityOk = await checkAvailabilityWithServer();
		if (!availabilityOk) {
			paymentError = availabilityError || 'The selected dates are not available.';
			return;
		}
		paymentProcessing = true;
		try {
			const totalPrice = calculatedPrice;
			if (totalPrice == null || totalPrice <= 0) {
				paymentError = 'Unable to calculate price. Please check trip details.';
				if (browser) console.error('[BookingForm] Invalid price:', totalPrice);
				paymentProcessing = false;
				return;
			}
			const formDataToSubmit = new FormData();
			formDataToSubmit.append('amount', totalPrice.toString());
			const bookingPayload = {
				basicDetails: formData.basicDetails,
				aboutTrip: formData.aboutTrip,
				route
			};
			formDataToSubmit.append('bookingPayload', JSON.stringify(bookingPayload));
			const response = await fetch('/?/createCheckout', {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: formDataToSubmit
			});
			if (!response.ok) {
				const errorText = await response.text();
				let errorData: { message?: string };
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { message: errorText || `Server returned ${response.status}` };
				}
				const msg = errorData.message || 'Payment request failed. Please try again.';
				paymentError = msg;
				if (browser) console.error('[BookingForm] createCheckout failed', response.status, errorText);
				paymentProcessing = false;
				return;
			}
			const result = await response.json();
			let checkoutUrl: string | null = null;
			if (result.url && typeof result.url === 'string') {
				checkoutUrl = result.url;
			} else if (result.data) {
				try {
					const parsedData = JSON.parse(result.data);
					if (Array.isArray(parsedData) && parsedData.length > 1) {
						checkoutUrl = parsedData[1];
					} else if (parsedData?.url) {
						checkoutUrl = parsedData.url;
					}
				} catch (_) {}
			}
			if (checkoutUrl && typeof checkoutUrl === 'string') {
				window.location.href = checkoutUrl;
			} else {
				paymentError = t.booking_payment_error || 'No checkout URL received. Please try again.';
				if (browser) console.error('[BookingForm] No checkout URL in response:', result);
				paymentProcessing = false;
			}
		} catch (error: any) {
			paymentError = error?.message || t.booking_payment_error || 'Payment failed. Please try again.';
			if (browser) console.error('[BookingForm] createCheckout error', error);
			paymentProcessing = false;
		}
	}

	const steps = [
		{ id: 1, key: 'basic_details' },
		{ id: 2, key: 'about_trip' }
	];

	const isStepEnabled = (stepId: number): boolean => {
		if (stepId === 1) return true;
		// Step is enabled if previous step is completed
		return completedSteps.includes(stepId - 1);
	};

	const canGoBack = (stepId: number): boolean => {
		// Can go back if we've completed this step or any previous step
		return completedSteps.includes(stepId) || completedSteps.some((s) => s < stepId);
	};

	const goToStep = (stepId: number) => {
		if (isStepEnabled(stepId) || canGoBack(stepId)) {
			currentStep = stepId;
		}
	};

	const nextStep = () => {
		if (currentStep < 2 && isStepEnabled(currentStep + 1)) {
			if (!completedSteps.includes(currentStep)) {
				completedSteps = [...completedSteps, currentStep];
			}
			currentStep++;
		}
	};

	const previousStep = () => {
		if (currentStep > 1) {
			currentStep--;
			paymentError = null;
		}
	};
</script>

<section id="booking-section" class="booking-section">
	<div class="booking-container">
		<h2 class="booking-title">{t.booking_section_two_steps}</h2>

		<!-- Tab Navigation -->
		<div class="booking-tabs">
			{#each steps as step}
				<button
					class="booking-tab"
					class:active={currentStep === step.id}
					class:disabled={!isStepEnabled(step.id) && !canGoBack(step.id)}
					onclick={() => goToStep(step.id)}
					disabled={!isStepEnabled(step.id) && !canGoBack(step.id)}
				>
					<span class="tab-label">{step.id}. {t[`booking_tab_${step.key}`]}</span>
				</button>
			{/each}
		</div>

		<!-- Form Container -->
		<div class="booking-form-container">
			<!-- Step 1: Basic Details -->
			{#if currentStep === 1}
				<BasicDetailsStep
					bind:basicDetails={formData.basicDetails}
					{fieldErrors}
					{validateField}
					onEmailBlur={scheduleEmailCheck}
				/>
			{/if}

			<!-- Step 2: About Your Trip -->
			{#if currentStep === 2}
				<Route
					bind:aboutTrip={formData.aboutTrip}
					{fieldErrors}
					{validateField}
				/>
				{#if availabilityError}
					<div class="payment-error-message" role="alert">{availabilityError}</div>
				{/if}
				{#if paymentError}
					<div class="payment-error-message" role="alert">{paymentError}</div>
				{/if}
			{/if}

			<!-- Navigation Buttons -->
			<div class="booking-navigation">
				{#if currentStep > 1}
					<button class="nav-button nav-button-previous" onclick={previousStep} disabled={paymentProcessing}>
						{t.booking_previous}
					</button>
				{/if}
				{#if currentStep < 2}
					<button class="nav-button nav-button-next" onclick={handleNext}>
						{t.booking_next}
					</button>
				{:else}
					<button
						class="nav-button nav-button-next nav-button-pay"
						onclick={handleNext}
						disabled={paymentProcessing}
					>
						{#if paymentProcessing}
							{t.booking_payment_processing}
						{:else}
							{t.booking_payment_button}
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.booking-section {
		min-height: 50vh;
		padding: 4rem 2rem;
		background: #f8f9fa;
	}

	@media (max-width: 768px) {
		.booking-section {
			padding: 2rem 0;
		}
	}

	.booking-container {
		max-width: 900px;
		margin: 0 auto;
	}

	@media (max-width: 768px) {
		.booking-container {
			padding: 0 1rem;
		}
	}

	.booking-title {
		font-size: 2.5rem;
		margin-bottom: 2rem;
		color: #333;
		text-align: center;
	}

	.booking-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid #e0e0e0;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	@media (max-width: 768px) {
		.booking-tabs {
			overflow-x: visible;
			flex-wrap: wrap;
		}
	}

	.booking-tab {
		flex: 1;
		min-width: 150px;
		padding: 1rem 1.5rem;
		background: transparent;
		border: none;
		border-bottom: 3px solid transparent;
		cursor: pointer;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
		color: #666;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.booking-tab {
			white-space: normal;
			text-align: center;
		}
	}

	.booking-tab:hover:not(.disabled) {
		background: #f0f0f0;
		color: #333;
	}

	.booking-tab.active {
		color: #007bff;
		border-bottom-color: #007bff;
		font-weight: 600;
	}

	.booking-tab.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tab-label {
		font-size: 0.9rem;
	}

	.booking-form-container {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.payment-error-message {
		color: #dc3545;
		font-weight: 500;
		padding: 1rem 0;
		margin-top: 1rem;
	}

	.nav-button-pay {
		margin-left: auto;
	}





	.booking-navigation {
		display: flex;
		justify-content: space-between;
		margin-top: 1rem;
		padding-top: 1rem;
	}

	.nav-button {
		padding: 0.75rem 2rem;
		font-size: 1rem;
		border-radius: 5px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s;
		border: none;
	}

	.nav-button-previous {
		background: #f8f9fa;
		color: #333;
	}

	.nav-button-previous:hover {
		background: #e9ecef;
	}

	.nav-button-next {
		background: #007bff;
		color: white;
		margin-left: auto;
	}

	.nav-button-next:hover {
		background: #0056b3;
	}

	@media (max-width: 768px) {
		.booking-tabs {
			gap: 0.25rem;
			margin: 0 -1rem 2rem -1rem;
			padding: 0 1rem;
		}

		.booking-tab {
			min-width: 120px;
			padding: 0.75rem 1rem;
			font-size: 0.8rem;
			white-space: normal;
		}

		.tab-label {
			font-size: 0.75rem;
		}

		.booking-form-container {
			padding: 1.5rem;
			border-radius: 0;
			margin: 0 -1rem;
		}

		.booking-title {
			font-size: 2rem;
		}
	}


</style>

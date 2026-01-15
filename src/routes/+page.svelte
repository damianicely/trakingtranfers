<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, generateRoute, formatDate, type Stage } from '$lib/trail';

	$: t = translations[$language];

	const scrollToBooking = () => {
		const bookingSection = document.getElementById('booking-section');
		if (bookingSection) {
			bookingSection.scrollIntoView({ behavior: 'smooth' });
		}
	};

	// Booking form state management
	let currentStep = 1;
	let formData: Record<string, any> = {
		basicDetails: {
			name: '',
			email: '',
			phone: '',
			bags: ''
		},
		aboutTrip: {
			departure: '',
			destination: '',
			departureDate: ''
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

	// Map old departure values to stage IDs
	const departureValueToStageId: Record<string, string> = {
		porto_covo: 'PC',
		vila_nova: 'VM',
		almograve: 'AL',
		zambujeira: 'ZM',
		odeceixe: 'OD',
		arrifana: 'AR',
		carrapateira: 'CP',
		sagres: 'SA',
		lagos: 'LG'
	};

	// Map stage IDs to names for display
	const stageNames = Object.fromEntries(STAGES.map((s: Stage) => [s.id, s.name]));

	// Generate route using generateRoute from trail.ts
	// Use reactive statement with explicit dependencies so Svelte tracks changes
	$: route = (() => {
		console.log('DEBUG: generateItinerary called', {
			departure: formData.aboutTrip.departure,
			destination: formData.aboutTrip.destination
		});

		if (!formData.aboutTrip.departure || !formData.aboutTrip.destination) {
			console.log('DEBUG: Missing departure or destination');
			return null;
		}

		const startId = departureValueToStageId[formData.aboutTrip.departure] || formData.aboutTrip.departure;
		const endId = departureValueToStageId[formData.aboutTrip.destination] || formData.aboutTrip.destination;

		console.log('DEBUG: Mapped IDs', { startId, endId });

		if (startId === endId) {
			console.log('DEBUG: Start and end are the same');
			return null;
		}

		const generatedRoute = generateRoute(startId, endId);
		console.log('DEBUG: Generated route', generatedRoute);
		return generatedRoute;
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

		console.log('🔍 DIAGNOSTIC: generateHotels reactive statement triggered', {
			route: currentRoute,
			routeLength: currentRoute?.length,
			departureDate: currentDepartureDate,
			hasRoute: !!currentRoute,
			hasDate: !!currentDepartureDate
		});

		if (!currentRoute || currentRoute.length === 0 || !currentDepartureDate) {
			console.log('❌ DIAGNOSTIC: generateHotels() returning null - missing data');
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

		// Night 0: Starting location (first segment's start point)
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
		currentRoute.forEach(([from, to]: [string, string], index: number) => {
			const checkInDate = new Date(currentDepartureDate);
			checkInDate.setDate(checkInDate.getDate() + index + 1);
			const checkInDateStr = checkInDate.toISOString().split('T')[0];
			hotels.push({
				nightIndex: index + 1,
				locationId: to,
				locationName: stageNames[to] || to,
				checkInDate: checkInDateStr,
				checkInDateFormatted: formatDate(currentDepartureDate, index + 1),
				name: '',
				address: ''
			});
		});

		console.log('✅ DIAGNOSTIC: generateHotels() returning', hotels.length, 'hotels', hotels);
		return hotels;
	})();

	$: console.log('🔍 DIAGNOSTIC: generatedHotels reactive updated', {
		generatedHotels: generatedHotels,
		length: generatedHotels?.length,
		route: route,
		routeLength: route?.length,
		departureDate: formData.aboutTrip.departureDate
	});

	// Reactive: Populate/update accommodation.hotels when generatedHotels changes
	$: {
		console.log('🔍 DIAGNOSTIC: Reactive statement for accommodation.hotels triggered', {
			generatedHotels: generatedHotels,
			generatedHotelsLength: generatedHotels?.length,
			currentHotelsLength: formData.accommodation.hotels.length,
			condition: generatedHotels && generatedHotels.length > 0
		});
		if (generatedHotels && generatedHotels.length > 0) {
			if (formData.accommodation.hotels.length === 0) {
				console.log('✅ DIAGNOSTIC: First time - populating hotels array');
				// First time: populate with generated structure
				formData.accommodation.hotels = generatedHotels;
				console.log('✅ DIAGNOSTIC: Hotels populated, new length:', formData.accommodation.hotels.length);
			} else if (formData.accommodation.hotels.length !== generatedHotels.length) {
				console.log('🔄 DIAGNOSTIC: Route changed - regenerating hotels');
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
			console.log('❌ DIAGNOSTIC: No generatedHotels - clearing hotels array');
			// Route cleared: clear hotels
			formData.accommodation.hotels = [];
		}
	}

	const validateAccommodation = (): boolean => {
		// If providing later, no validation needed
		if (formData.accommodation.provideLater) {
			return true;
		}

		// Otherwise, all hotels must have name and address
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
				errors[`hotel_${index}_address`] = t.booking_hotel_address_error;
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
		const { name, email, phone, bags } = formData.basicDetails;

		if (!name.trim()) {
			errors.name = t.booking_name_error;
		}

		if (!email.trim()) {
			errors.email = t.booking_email_error;
		} else if (!validateEmail(email)) {
			errors.email = t.booking_email_error;
		}

		if (!phone.trim()) {
			errors.phone = t.booking_phone_error;
		}

		if (!bags || Number(bags) < 0) {
			errors.bags = t.booking_bags_error;
		}

		fieldErrors = { ...fieldErrors, ...errors };
		return Object.keys(errors).length === 0;
	};

	const validateField = (fieldName: string, value: string) => {
		const errors: Record<string, string> = { ...fieldErrors };

		switch (fieldName) {
			case 'name':
				if (!value.trim()) {
					errors.name = t.booking_name_error;
				} else {
					delete errors.name;
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
		const { departure, destination, departureDate } = formData.aboutTrip;

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
				// Store route in formData
				if (route) {
					formData.itinerary = route;
				}
				if (!completedSteps.includes(2)) {
					completedSteps = [...completedSteps, 2];
				}
				nextStep();
			}
		} else if (currentStep === 3) {
			if (validateAccommodation()) {
				if (!completedSteps.includes(3)) {
					completedSteps = [...completedSteps, 3];
				}
				nextStep();
			}
		} else {
			nextStep();
		}
	};

	const steps = [
		{ id: 1, key: 'basic_details' },
		{ id: 2, key: 'about_trip' },
		{ id: 3, key: 'accommodation' },
		{ id: 4, key: 'payment' }
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
		if (currentStep < 4 && isStepEnabled(currentStep + 1)) {
			if (!completedSteps.includes(currentStep)) {
				completedSteps = [...completedSteps, currentStep];
			}
			currentStep++;
		}
	};

	const previousStep = () => {
		if (currentStep > 1) {
			currentStep--;
		}
	};
</script>

<section class="hero">
	<div class="hero-content">
		<h1>{t.hero_title}</h1>
		<button class="book-button" onclick={scrollToBooking}>{t.book_now}</button>
	</div>
	<div class="hero-image">
		<!-- Placeholder for hero image - replace with actual image -->
		<div class="hero-image-placeholder">
			<span>Hero Image</span>
		</div>
	</div>
</section>

<section id="booking-section" class="booking-section">
	<div class="booking-container">
		<h2 class="booking-title">{t.booking_section}</h2>

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
					<span class="tab-number">{step.id}</span>
					<span class="tab-label">{t[`booking_tab_${step.key}`]}</span>
				</button>
			{/each}
		</div>

		<!-- Form Container -->
		<div class="booking-form-container">
			<!-- Step 1: Basic Details -->
			{#if currentStep === 1}
				<div class="booking-step">
					<h3 class="step-title">{t.booking_step_basic_details_title}</h3>
					<form class="booking-form" onsubmit={(e) => { e.preventDefault(); handleNext(); }}>
						<div class="form-group">
							<label for="name" class="form-label">{t.booking_name_label}</label>
							<input
								type="text"
								id="name"
								class="form-input"
								class:error={fieldErrors.name}
								placeholder={t.booking_name_placeholder}
								bind:value={formData.basicDetails.name}
								onblur={() => validateField('name', formData.basicDetails.name)}
							/>
							{#if fieldErrors.name}
								<span class="error-message">{fieldErrors.name}</span>
							{/if}
						</div>

						<div class="form-group">
							<label for="email" class="form-label">{t.booking_email_label}</label>
							<input
								type="email"
								id="email"
								class="form-input"
								class:error={fieldErrors.email}
								placeholder={t.booking_email_placeholder}
								bind:value={formData.basicDetails.email}
								onblur={() => validateField('email', formData.basicDetails.email)}
							/>
							{#if fieldErrors.email}
								<span class="error-message">{fieldErrors.email}</span>
							{/if}
						</div>

						<div class="form-group">
							<label for="phone" class="form-label">{t.booking_phone_label}</label>
							<input
								type="tel"
								id="phone"
								class="form-input"
								class:error={fieldErrors.phone}
								placeholder={t.booking_phone_placeholder}
								bind:value={formData.basicDetails.phone}
								onblur={() => validateField('phone', formData.basicDetails.phone)}
							/>
							{#if fieldErrors.phone}
								<span class="error-message">{fieldErrors.phone}</span>
							{/if}
						</div>

						<div class="form-group">
							<label for="bags" class="form-label">{t.booking_bags_label}</label>
							<input
								type="number"
								id="bags"
								class="form-input"
								class:error={fieldErrors.bags}
								placeholder={t.booking_bags_placeholder}
								min="0"
								bind:value={formData.basicDetails.bags}
								onblur={() => validateField('bags', formData.basicDetails.bags)}
							/>
							{#if fieldErrors.bags}
								<span class="error-message">{fieldErrors.bags}</span>
							{/if}
						</div>
					</form>
				</div>
			{/if}

			<!-- Step 2: About Your Trip -->
			{#if currentStep === 2}
				<div class="booking-step">
					<h3 class="step-title">{t.booking_step_about_trip_title}</h3>
					<form class="booking-form" onsubmit={(e) => { e.preventDefault(); handleNext(); }}>

						<div class="form-group">
							<label for="departureDate" class="form-label">{t.booking_departure_date_label}</label>
							<input
								type="date"
								id="departureDate"
								class="form-input"
								class:error={fieldErrors.departureDate}
								min={getMinDate()}
								bind:value={formData.aboutTrip.departureDate}
								onblur={() => validateField('departureDate', formData.aboutTrip.departureDate)}
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
								<span class="error-message">{fieldErrors.departureDate}</span>
							{/if}
						</div>

						<div class="form-group">
							<label for="departure" class="form-label">{t.booking_departure_label}</label>
							<select
								id="departure"
								class="form-input"
								class:error={fieldErrors.departure}
								bind:value={formData.aboutTrip.departure}
								onchange={() => validateField('departure', formData.aboutTrip.departure)}
							>
								<option value="">{t.booking_departure_placeholder}</option>
								<option value="porto_covo">{t.booking_departure_porto_covo}</option>
								<option value="vila_nova">{t.booking_departure_vila_nova}</option>
								<option value="almograve">{t.booking_departure_almograve}</option>
								<option value="zambujeira">{t.booking_departure_zambujeira}</option>
								<option value="odeceixe">{t.booking_departure_odeceixe}</option>
								<option value="arrifana">{t.booking_departure_arrifana}</option>
								<option value="carrapateira">{t.booking_departure_carrapateira}</option>
								<option value="sagres">{t.booking_departure_sagres}</option>
								<option value="lagos">{t.booking_departure_lagos}</option>
							</select>
							{#if fieldErrors.departure}
								<span class="error-message">{fieldErrors.departure}</span>
							{/if}
						</div>

						<div class="form-group">
							<label for="destination" class="form-label">{t.booking_destination_label || 'Destination'}</label>
							<select
								id="destination"
								class="form-input"
								class:error={fieldErrors.destination}
								bind:value={formData.aboutTrip.destination}
								onchange={() => validateField('destination', formData.aboutTrip.destination)}
							>
								<option value="">{t.booking_destination_placeholder || 'Select your destination'}</option>
								<option value="porto_covo">{t.booking_departure_porto_covo}</option>
								<option value="vila_nova">{t.booking_departure_vila_nova}</option>
								<option value="almograve">{t.booking_departure_almograve}</option>
								<option value="zambujeira">{t.booking_departure_zambujeira}</option>
								<option value="odeceixe">{t.booking_departure_odeceixe}</option>
								<option value="arrifana">{t.booking_departure_arrifana}</option>
								<option value="carrapateira">{t.booking_departure_carrapateira}</option>
								<option value="sagres">{t.booking_departure_sagres}</option>
								<option value="lagos">{t.booking_departure_lagos}</option>
							</select>
							{#if fieldErrors.destination}
								<span class="error-message">{fieldErrors.destination}</span>
							{/if}
						</div>

						<!-- DEBUG INFO -->
						<div class="debug-info" style="padding: 1rem; background: #f0f0f0; margin: 1rem 0; border-radius: 4px; font-size: 0.85rem;">
							<strong>DEBUG:</strong><br>
							Departure: {formData.aboutTrip.departure || '(empty)'}<br>
							Destination: {formData.aboutTrip.destination || '(empty)'}<br>
							Date: {formData.aboutTrip.departureDate || '(empty)'}<br>
							Route: {route ? JSON.stringify(route) : 'null'} (length: {route ? route.length : 0})<br>
						</div>

						{#if route && route.length > 0 && formData.aboutTrip.departureDate}
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
												<td>{formatDate(formData.aboutTrip.departureDate, i)}</td>
												<td>{stageNames[from]} → {stageNames[to]}</td>
											</tr>
										{/each}
									</tbody>
								</table>
								<div class="itinerary-summary">
									Total duration: {route.length} days of walking.
								</div>
							</div>
						{:else if formData.aboutTrip.departure && formData.aboutTrip.destination && formData.aboutTrip.departure === formData.aboutTrip.destination}
							<p class="error-message" style="text-align: center; margin-top: 1rem;">
								Start and destination cannot be the same town.
							</p>
						{:else}
							<div class="itinerary-placeholder">
								<p>Select your start point, destination, and date to generate your itinerary.</p>
							</div>
						{/if}

						{#if route && route.length > 0}
							<div class="route-description">
								<p class="route-description-text">
									{route.length} days of walking remaining.
								</p>
							</div>
						{:else}
							<div class="route-description">
								<p class="route-description-text">
									Select your location and destination to calculate your trip.
								</p>
							</div>
						{/if}
					</form>
				</div>
			{/if}

			<!-- Step 3: Your Accommodation -->
			{#if currentStep === 3}
				<div class="booking-step">
					<h3 class="step-title">{t.booking_step_accommodation_title}</h3>
					<form class="booking-form" onsubmit={(e) => { e.preventDefault(); handleNext(); }}>
						<div class="accommodation-later-group">
							<label class="checkbox-label">
								<input
									type="checkbox"
									bind:checked={formData.accommodation.provideLater}
									onchange={() => {
										if (formData.accommodation.provideLater) {
											// Clear hotel errors when providing later
											Object.keys(fieldErrors).forEach((key) => {
												if (key.startsWith('hotel_')) {
													delete fieldErrors[key];
												}
											});
											fieldErrors = { ...fieldErrors };
										}
									}}
								/>
								<span>{t.booking_accommodation_later_label}</span>
							</label>
							<p class="accommodation-warning">{t.booking_accommodation_warning}</p>
						</div>

						<!-- DIAGNOSTIC INFO FOR STEP 3 -->
						<div class="debug-info" style="padding: 1rem; background: #e7f3ff; margin: 1rem 0; border: 2px solid #007bff; border-radius: 4px; font-size: 0.85rem;">
							<strong>🔍 STEP 3 DIAGNOSTICS:</strong><br>
							Route: {route ? JSON.stringify(route) : 'null'} (length: {route ? route.length : 0})<br>
							Departure Date: {formData.aboutTrip.departureDate || '(empty)'}<br>
							Generated Hotels: {generatedHotels ? generatedHotels.length : 'null'} hotels<br>
							Accommodation Hotels Array: {formData.accommodation.hotels.length} hotels<br>
							Provide Later: {formData.accommodation.provideLater ? 'true' : 'false'}<br>
							Condition Check: route exists={!!route}, route.length={route?.length || 0}, hasDate={!!formData.aboutTrip.departureDate}<br>
							generateHotels would return: {route && route.length > 0 && formData.aboutTrip.departureDate ? 'HOTELS' : 'NULL'}
						</div>

						{#if !formData.accommodation.provideLater}
							{#if formData.accommodation.hotels.length === 0}
								<p class="accommodation-loading">Please complete Step 2 to see accommodation details.</p>
								<div class="debug-info" style="padding: 1rem; background: #fff3cd; margin: 1rem 0; border: 2px solid #ffc107; border-radius: 4px; font-size: 0.85rem;">
									<strong>⚠️ WHY NO HOTELS?</strong><br>
									Hotels array length: {formData.accommodation.hotels.length}<br>
									Generated hotels: {generatedHotels ? generatedHotels.length : 'null'}<br>
									Route exists: {route ? 'YES' : 'NO'}<br>
									Route length: {route?.length || 0}<br>
									Departure date: {formData.aboutTrip.departureDate || 'MISSING'}
								</div>
							{:else if formData.accommodation.hotels.length > 0}
								<div class="hotels-container">
									{#each formData.accommodation.hotels as hotel, index}
										{@const isComplete = hotel.name.trim() && hotel.address.trim()}
										<div class="hotel-section" class:complete={isComplete} class:incomplete={!isComplete}>
											<div class="hotel-header">
												<div class="hotel-header-left">
													<span class="hotel-status-icon">
														{#if isComplete}✓{/if}
														{#if !isComplete}✗{/if}
													</span>
													<span class="hotel-label">
														{t.booking_hotel_label} {hotel.nightIndex + 1} - {hotel.locationName}
													</span>
												</div>
												<span class="hotel-status-text">
													{#if isComplete}
														{t.booking_accommodation_complete}
													{:else}
														{t.booking_accommodation_incomplete}
													{/if}
												</span>
											</div>

											<div class="hotel-content">
												<div class="form-group">
													<div class="form-label">{t.booking_hotel_checkin_label}</div>
													<div class="hotel-checkin-display">{hotel.checkInDateFormatted}</div>
												</div>

												<div class="form-group">
													<label for="hotel_name_{index}" class="form-label">{t.booking_hotel_name_label}</label>
													<input
														type="text"
														id="hotel_name_{index}"
														class="form-input"
														class:error={fieldErrors[`hotel_${index}_name`]}
														placeholder={t.booking_hotel_name_placeholder}
														bind:value={hotel.name}
														onblur={() => {
															if (hotel.name.trim()) {
																delete fieldErrors[`hotel_${index}_name`];
																fieldErrors = { ...fieldErrors };
															} else {
																validateAccommodation();
															}
														}}
													/>
													{#if fieldErrors[`hotel_${index}_name`]}
														<span class="error-message">{fieldErrors[`hotel_${index}_name`]}</span>
													{/if}
												</div>

												<div class="form-group">
													<label for="hotel_address_{index}" class="form-label">{t.booking_hotel_address_label}</label>
													<input
														type="text"
														id="hotel_address_{index}"
														class="form-input"
														class:error={fieldErrors[`hotel_${index}_address`]}
														placeholder={t.booking_hotel_address_placeholder}
														bind:value={hotel.address}
														onblur={() => {
															if (hotel.address.trim()) {
																delete fieldErrors[`hotel_${index}_address`];
																fieldErrors = { ...fieldErrors };
															} else {
																validateAccommodation();
															}
														}}
													/>
													{#if fieldErrors[`hotel_${index}_address`]}
														<span class="error-message">{fieldErrors[`hotel_${index}_address`]}</span>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</form>
				</div>
			{/if}

			<!-- Step 4: Payment -->
			{#if currentStep === 4}
				<div class="booking-step">
					<h3 class="step-title">{t.booking_step_payment_title}</h3>
					<p class="step-placeholder">Payment form will be added here</p>
				</div>
			{/if}

			<!-- Navigation Buttons -->
			<div class="booking-navigation">
				{#if currentStep > 1}
					<button class="nav-button nav-button-previous" onclick={previousStep}>
						{t.booking_previous}
					</button>
				{/if}
				{#if currentStep < 4}
					<button class="nav-button nav-button-next" onclick={handleNext}>
						{t.booking_next}
					</button>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		width: 100%;
		min-height: 90vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
	}

	.hero-image-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 2rem;
		font-weight: bold;
	}

	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		color: white;
		padding: 2rem;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 10px;
		backdrop-filter: blur(5px);
	}

	.hero-content h1 {
		font-size: 3rem;
		margin-bottom: 2rem;
		font-weight: 700;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.book-button {
		padding: 1rem 3rem;
		font-size: 1.25rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 50px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s;
		box-shadow: 0 4px 15px rgba(0, 123, 255, 0.4);
	}

	.book-button:hover {
		background: #0056b3;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 123, 255, 0.6);
	}

	.book-button:active {
		transform: translateY(0);
	}

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
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
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

	.tab-number {
		font-size: 1.2rem;
		font-weight: 700;
	}

	.tab-label {
		font-size: 0.85rem;
	}

	.booking-form-container {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.booking-step {
		min-height: 300px;
	}

	.step-title {
		font-size: 1.8rem;
		margin-bottom: 1.5rem;
		color: #333;
	}

	.step-placeholder {
		color: #999;
		font-style: italic;
		padding: 2rem;
		text-align: center;
	}

	.booking-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-weight: 600;
		color: #333;
		font-size: 0.95rem;
	}

	.form-input {
		padding: 0.75rem 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 5px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.3s;
		width: 100%;
		background-color: white;
	}

	.form-input[type='text'],
	.form-input[type='email'],
	.form-input[type='tel'],
	.form-input[type='number'] {
		cursor: text;
	}

	select.form-input {
		cursor: pointer;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		padding-right: 2.5rem;
		appearance: none;
		-webkit-appearance: none;
	}

	.form-input:focus {
		outline: none;
		border-color: #007bff;
	}

	.form-input.error {
		border-color: #dc3545;
	}

	.error-message {
		color: #dc3545;
		font-size: 0.875rem;
		margin-top: -0.25rem;
	}

	.itinerary-container {
		margin-top: 2rem;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #e0e0e0;
	}

	.itinerary-title {
		font-size: 1.3rem;
		font-weight: 600;
		color: #333;
		margin-bottom: 1rem;
		padding: 1.5rem 1.5rem 0 1.5rem;
	}

	.itinerary-table {
		width: 100%;
		text-align: left;
		border-collapse: collapse;
	}

	.itinerary-table thead {
		background: #f8f9fa;
	}

	.itinerary-table th {
		padding: 0.75rem;
		border-bottom: 1px solid #e0e0e0;
		font-weight: 600;
	}

	.itinerary-table tbody tr:hover {
		background: #f8f9fa;
	}

	.itinerary-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.itinerary-table tbody tr:last-child td {
		border-bottom: none;
	}

	.itinerary-summary {
		padding: 1rem;
		background: #e7f3ff;
		color: #0056b3;
		font-size: 0.9rem;
		font-style: italic;
	}

	.itinerary-placeholder {
		text-align: center;
		padding: 3rem;
		border: 2px dashed #e0e0e0;
		border-radius: 8px;
		color: #666;
		margin-top: 2rem;
	}

	.route-description {
		margin-top: 2rem;
		padding: 1rem;
		background: #e7f3ff;
		border: 1px solid #b3d9ff;
		border-radius: 8px;
		text-align: center;
	}

	.route-description-text {
		margin: 0;
		color: #0056b3;
		font-weight: 600;
		font-size: 1rem;
	}

	.accommodation-later-group {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #fff3cd;
		border: 2px solid #ffc107;
		border-radius: 8px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 600;
		margin-bottom: 0.75rem;
	}

	.checkbox-label input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: #007bff;
	}

	.accommodation-warning {
		margin: 0;
		color: #856404;
		font-size: 0.9rem;
		margin-left: 2rem;
	}

	.accommodation-loading {
		padding: 2rem;
		text-align: center;
		color: #666;
		font-style: italic;
	}

	.hotels-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.hotel-section {
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.3s;
	}

	.hotel-section.complete {
		border-color: #28a745;
		background: #f8fff9;
	}

	.hotel-section.incomplete {
		border-color: #dc3545;
		background: #fff8f8;
	}

	.hotel-header {
		width: 100%;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: left;
		font-size: 1rem;
	}

	.hotel-header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.hotel-status-icon {
		font-size: 1.5rem;
		font-weight: bold;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.hotel-section.complete .hotel-status-icon {
		color: #28a745;
		background: #d4edda;
	}

	.hotel-section.incomplete .hotel-status-icon {
		color: #dc3545;
		background: #f8d7da;
	}

	.hotel-label {
		font-weight: 600;
		color: #333;
	}

	.hotel-status-text {
		font-size: 0.9rem;
		font-weight: 600;
		margin-right: 1rem;
	}

	.hotel-section.complete .hotel-status-text {
		color: #28a745;
	}

	.hotel-section.incomplete .hotel-status-text {
		color: #dc3545;
	}

	.hotel-content {
		padding: 1.5rem;
		background: white;
		border-top: 1px solid #e0e0e0;
	}

	.hotel-checkin-display {
		padding: 0.75rem;
		background: #f8f9fa;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		color: #666;
		font-weight: 500;
	}

	.booking-navigation {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e0e0e0;
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
		}

		.tab-number {
			display: none;
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

	@media (max-width: 768px) {
		.hero-content h1 {
			font-size: 2rem;
		}

		.book-button {
			padding: 0.75rem 2rem;
			font-size: 1rem;
		}
	}
</style>

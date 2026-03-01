<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, generateRoute, type Stage } from '$lib/trail';
	import { browser } from '$app/environment';
	import { calculateBookingPrice } from '$lib/booking/price';
	import { EMAIL_ALREADY_REGISTERED_MESSAGE } from '$lib/booking/constants';
	import { openLoginModal } from '$lib/stores/loginModal';

	let { user = null }: { user?: { username: string; id?: string } | null } = $props();

	// Language
	const t = $derived(translations[$language]);

	// Keep email in sync when logged-in user is present
	$effect(() => {
		if (user?.username) {
			formData.email = user.username;
		}
	});

	// Form state - single step
	let formData = $state({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		accommodationNames: '',
		departure: '',
		destination: '',
		departureDate: '',
		bags: '1'
	});

	let fieldErrors = $state<Record<string, string>>({});
	let paymentProcessing = $state(false);
	let paymentError = $state<string | null>(null);
	let availabilityError = $state<string | null>(null);
	let emailCheckDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Stage names
	const stageNames = Object.fromEntries(STAGES.map((s: Stage) => [s.id, s.name]));

	// Generate route
	const route = $derived(
		(() => {
			if (!formData.departure || !formData.destination) return null;
			if (formData.departure === formData.destination) return null;
			return generateRoute(formData.departure, formData.destination);
		})()
	);

	// Price calculation
	const calculatedPrice = $derived(calculateBookingPrice(route, formData.bags));

	// Email check
	async function checkEmailWithServer(): Promise<boolean> {
		const email = formData.email.trim().toLowerCase();
		if (!email) return true;
		if (user?.username && email === user.username.trim().toLowerCase()) return true;
		try {
			const res = await fetch('/api/booking/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'email', email })
			});
			const data = await res.json().catch(() => ({}));
			if (res.status === 429) {
				fieldErrors = { ...fieldErrors, email: data.message || 'Too many requests' };
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
			fieldErrors = { ...fieldErrors, email: 'Could not verify email' };
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

	// Availability check
	async function checkAvailabilityWithServer(): Promise<boolean> {
		const departureDate = formData.departureDate.trim();
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
				availabilityError = data.message || 'Too many requests';
				return false;
			}
			if (data.ok === false && data.message) {
				availabilityError = data.message;
				return false;
			}
			availabilityError = null;
			return true;
		} catch (_) {
			availabilityError = 'Could not check availability';
			return false;
		}
	}

	// Validation
	function validateField(fieldName: string, value: string) {
		let error = '';
		if (!value || value.trim() === '') {
			switch (fieldName) {
				case 'firstName':
					error = $language === 'en' ? 'First name is required' : 'O primeiro nome é obrigatório';
					break;
				case 'lastName':
					error = $language === 'en' ? 'Last name is required' : 'O apelido é obrigatório';
					break;
				case 'email':
					error = $language === 'en' ? 'Email is required' : 'O email é obrigatório';
					break;
				case 'phone':
					error = $language === 'en' ? 'Phone is required' : 'O telefone é obrigatório';
					break;
				case 'departure':
					error =
						$language === 'en' ? 'Departure point is required' : 'O ponto de partida é obrigatório';
					break;
				case 'destination':
					error = $language === 'en' ? 'Destination is required' : 'O destino é obrigatório';
					break;
				case 'departureDate':
					error = $language === 'en' ? 'Date is required' : 'A data é obrigatória';
					break;
				case 'bags':
					error =
						$language === 'en' ? 'Number of bags is required' : 'O número de malas é obrigatório';
					break;
			}
		} else if (fieldName === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			error =
				$language === 'en' ? 'Please enter a valid email' : 'Por favor insira um email válido';
		}
		fieldErrors = { ...fieldErrors, [fieldName]: error };
	}

	function validateForm(): boolean {
		console.log('[BookingForm] Validating form...');
		const isLoggedIn = !!user?.username;
		let errors: Record<string, string> = {};

		if (!isLoggedIn) {
			if (!formData.firstName?.trim())
				errors.firstName =
					$language === 'en' ? 'First name is required' : 'O primeiro nome é obrigatório';
			if (!formData.lastName?.trim())
				errors.lastName = $language === 'en' ? 'Last name is required' : 'O apelido é obrigatório';
			if (!formData.phone?.trim())
				errors.phone = $language === 'en' ? 'Phone is required' : 'O telefone é obrigatório';
		}

		if (!formData.email?.trim())
			errors.email = $language === 'en' ? 'Email is required' : 'O email é obrigatório';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email =
				$language === 'en' ? 'Please enter a valid email' : 'Por favor insira um email válido';
		}

		if (!formData.departure?.trim())
			errors.departure =
				$language === 'en' ? 'Departure point is required' : 'O ponto de partida é obrigatório';
		if (!formData.destination?.trim())
			errors.destination =
				$language === 'en' ? 'Destination is required' : 'O destino é obrigatório';
		if (!formData.departureDate?.trim())
			errors.departureDate = $language === 'en' ? 'Date is required' : 'A data é obrigatória';

		const bagsValue = String(formData.bags || '').trim();
		if (!bagsValue || bagsValue === '0')
			errors.bags =
				$language === 'en' ? 'Number of bags is required' : 'O número de malas é obrigatório';

		// Check for route validity
		if (formData.departure && formData.destination && formData.departure === formData.destination) {
			errors.destination =
				$language === 'en'
					? 'Destination must be different from departure'
					: 'O destino deve ser diferente da partida';
		}

		fieldErrors = { ...fieldErrors, ...errors };
		const hasErrors = Object.keys(errors).length === 0;
		const hasRoute = route !== null && route.length > 0;
		console.log(
			'[BookingForm] Validation - hasErrors:',
			hasErrors,
			'hasRoute:',
			hasRoute,
			'route:',
			route
		);
		return hasErrors && hasRoute;
	}

	// Payment
	async function handleSubmit() {
		console.log('[BookingForm] Pay Now clicked');
		console.log('[BookingForm] Current form data:', formData);
		console.log('[BookingForm] Route:', route, 'Route length:', route?.length);
		const isValid = validateForm();
		console.log('[BookingForm] Form validation result:', isValid);
		console.log('[BookingForm] Current errors:', fieldErrors);
		if (!isValid) {
			console.log('[BookingForm] Validation failed');
			return;
		}
		paymentError = null;
		availabilityError = null;

		console.log('[BookingForm] Checking email with server...');
		const emailOk = await checkEmailWithServer();
		console.log('[BookingForm] Email check result:', emailOk);
		if (!emailOk) {
			paymentError = fieldErrors.email || 'Please fix the email error';
			console.log('[BookingForm] Email check failed:', paymentError);
			return;
		}

		console.log('[BookingForm] Checking availability...');
		const availabilityOk = await checkAvailabilityWithServer();
		if (!availabilityOk) {
			paymentError = availabilityError || 'Dates not available';
			console.log('[BookingForm] Availability check failed:', paymentError);
			return;
		}

		console.log('[BookingForm] Starting payment processing...');
		paymentProcessing = true;
		try {
			const totalPrice = calculatedPrice;
			if (totalPrice == null || totalPrice <= 0) {
				paymentError = 'Unable to calculate price';
				paymentProcessing = false;
				return;
			}

			const formDataToSubmit = new FormData();
			formDataToSubmit.append('amount', totalPrice.toString());
			formDataToSubmit.append(
				'bookingPayload',
				JSON.stringify({
					basicDetails: {
						firstName: formData.firstName,
						lastName: formData.lastName,
						email: formData.email,
						phone: formData.phone,
						bookingNames: formData.accommodationNames
					},
					aboutTrip: {
						departure: formData.departure,
						destination: formData.destination,
						departureDate: formData.departureDate,
						bags: formData.bags
					},
					route
				})
			);

			console.log('[BookingForm] Submitting to createCheckout with amount:', totalPrice);
			const response = await fetch('/?/createCheckout', {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: formDataToSubmit
			});
			console.log('[BookingForm] Response status:', response.status, response.ok);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Payment failed' }));
				console.log('[BookingForm] Response error:', errorData);
				paymentError = errorData.message || 'Payment request failed';
				paymentProcessing = false;
				return;
			}

			const result = await response.json();
			let checkoutUrl: string | null = null;

			if (result.url && typeof result.url === 'string') {
				checkoutUrl = result.url;
			} else if (result.data) {
				try {
					const parsed = JSON.parse(result.data);
					if (Array.isArray(parsed) && parsed.length > 1) {
						checkoutUrl = parsed[1];
					} else if (parsed?.url) {
						checkoutUrl = parsed.url;
					}
				} catch (_) {}
			}

			if (checkoutUrl) {
				window.location.href = checkoutUrl;
			} else {
				paymentError = 'No checkout URL received';
				paymentProcessing = false;
			}
		} catch (error: any) {
			paymentError = error?.message || 'Payment failed';
			paymentProcessing = false;
		}
	}

	// Helper functions
	const getTomorrowDate = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split('T')[0];
	};
</script>

<form
	class="booking-form-single"
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<!-- Trip Details Row -->
	<div class="form-grid">
		<div class="form-group">
			<label for="departure">{$language === 'en' ? 'From' : 'De'}</label>
			<select
				id="departure"
				class:error={fieldErrors.departure}
				bind:value={formData.departure}
				onchange={() => validateField('departure', formData.departure)}
				required
			>
				<option value=""
					>{$language === 'en' ? 'Select starting point' : 'Selecione ponto de partida'}</option
				>
				{#each STAGES as stage}
					<option value={stage.id}>{stage.name}</option>
				{/each}
			</select>
			{#if fieldErrors.departure}
				<span class="error-message">{fieldErrors.departure}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="destination">{$language === 'en' ? 'To' : 'Para'}</label>
			<select
				id="destination"
				class:error={fieldErrors.destination}
				bind:value={formData.destination}
				onchange={() => validateField('destination', formData.destination)}
				required
			>
				<option value="">{$language === 'en' ? 'Select destination' : 'Selecione destino'}</option>
				{#each STAGES as stage}
					<option value={stage.id}>{stage.name}</option>
				{/each}
			</select>
			{#if fieldErrors.destination}
				<span class="error-message">{fieldErrors.destination}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="departureDate">{$language === 'en' ? 'Date' : 'Data'}</label>
			<input
				type="date"
				id="departureDate"
				class:error={fieldErrors.departureDate}
				min={getTomorrowDate()}
				bind:value={formData.departureDate}
				onblur={() => validateField('departureDate', formData.departureDate)}
				required
			/>
			{#if fieldErrors.departureDate}
				<span class="error-message">{fieldErrors.departureDate}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="bags">{$language === 'en' ? 'Number of Bags' : 'Número de Malas'}</label>
			<select
				id="bags"
				class:error={fieldErrors.bags}
				bind:value={formData.bags}
				onchange={() => validateField('bags', formData.bags)}
				required
			>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="4">4</option>
				<option value="5">5+</option>
			</select>
			{#if fieldErrors.bags}
				<span class="error-message">{fieldErrors.bags}</span>
			{/if}
		</div>
	</div>

	<!-- Name Row - same 4-column grid for symmetry -->
	{#if !user}
		<div class="form-grid">
			<div class="form-group">
				<label for="firstName">{$language === 'en' ? 'First Name' : 'Primeiro Nome'}</label>
				<input
					type="text"
					id="firstName"
					class:error={fieldErrors.firstName}
					placeholder="John"
					bind:value={formData.firstName}
					onblur={() => validateField('firstName', formData.firstName)}
					required
				/>
				{#if fieldErrors.firstName}
					<span class="error-message">{fieldErrors.firstName}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="lastName">{$language === 'en' ? 'Last Name' : 'Apelido'}</label>
				<input
					type="text"
					id="lastName"
					class:error={fieldErrors.lastName}
					placeholder="Doe"
					bind:value={formData.lastName}
					onblur={() => validateField('lastName', formData.lastName)}
					required
				/>
				{#if fieldErrors.lastName}
					<span class="error-message">{fieldErrors.lastName}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="email">{$language === 'en' ? 'Email' : 'Email'}</label>
				<input
					type="email"
					id="email"
					class:error={fieldErrors.email}
					placeholder="john@example.com"
					bind:value={formData.email}
					onblur={() => {
						validateField('email', formData.email);
						if (formData.email?.trim()) scheduleEmailCheck();
					}}
					required
				/>
				{#if fieldErrors.email}
					<span class="error-message">{fieldErrors.email}</span>
					{#if fieldErrors.email === EMAIL_ALREADY_REGISTERED_MESSAGE}
						<button type="button" class="text-link" onclick={() => openLoginModal.set(true)}>
							{$language === 'en' ? 'Log in instead' : 'Iniciar sessão'}
						</button>
					{/if}
				{/if}
			</div>

			<div class="form-group">
				<label for="phone">{$language === 'en' ? 'Phone' : 'Telefone'}</label>
				<input
					type="tel"
					id="phone"
					class:error={fieldErrors.phone}
					placeholder="+351 900 000 000"
					bind:value={formData.phone}
					onblur={() => validateField('phone', formData.phone)}
					required
				/>
				{#if fieldErrors.phone}
					<span class="error-message">{fieldErrors.phone}</span>
				{/if}
			</div>
		</div>
	{:else}
		<div class="form-grid">
			<div class="form-group full-width">
				<label for="email">{$language === 'en' ? 'Email' : 'Email'}</label>
				<input type="email" id="email" class:readonly={true} value={formData.email} readonly />
			</div>
		</div>
	{/if}

	<!-- Accommodation Names Row -->
	<div class="form-row">
		<div class="form-group full-width">
			<label for="accommodationNames"
				>{$language === 'en'
					? 'Names used at your accommodation'
					: 'Nomes usados na sua acomodação'}</label
			>
			<input
				type="text"
				id="accommodationNames"
				placeholder={$language === 'en'
					? 'If different from your name above'
					: 'Se diferente do seu nome acima'}
				bind:value={formData.accommodationNames}
			/>
		</div>
	</div>

	<!-- Price Summary & Submit -->
	{#if route && route.length > 0 && calculatedPrice !== null}
		<div class="price-summary-compact">
			<div class="price-row">
				<span>{route.length} {$language === 'en' ? 'days' : 'dias'} · {calculatedPrice}€</span>
			</div>
		</div>
	{/if}

	{#if availabilityError}
		<div class="error-banner">{availabilityError}</div>
	{/if}
	{#if paymentError}
		<div class="error-banner">
			{paymentError}
			{#if paymentError === EMAIL_ALREADY_REGISTERED_MESSAGE}
				<button type="button" class="text-link" onclick={() => openLoginModal.set(true)}>
					{$language === 'en' ? 'Log in' : 'Iniciar sessão'}
				</button>
			{/if}
		</div>
	{/if}

	<button
		type="submit"
		class="submit-btn"
		disabled={paymentProcessing}
		onclick={() => console.log('[BookingForm] Button clicked via onclick')}
	>
		{#if paymentProcessing}
			{$language === 'en' ? 'Processing...' : 'A processar...'}
		{:else}
			{$language === 'en' ? 'Pay Now' : 'Pagar Agora'}
		{/if}
	</button>
</form>

<style>
	.booking-form-single {
		width: 100%;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #333;
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #ddd;
		border-radius: 2px;
		font-family: inherit;
		font-size: 0.9375rem;
		color: #1a1a1a;
		background: white;
		transition: all 0.3s ease;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #1a1a1a;
	}

	.form-group input.error,
	.form-group select.error {
		border-color: #dc2626;
	}

	.form-group input.readonly {
		background: #f5f5f0;
		color: #666;
		cursor: not-allowed;
	}

	.form-group input::placeholder {
		color: #999;
	}

	.error-message {
		font-size: 0.8125rem;
		color: #dc2626;
		font-weight: 500;
	}

	.text-link {
		background: none;
		border: none;
		color: #c4a77d;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
		margin-left: 0.5rem;
	}

	.text-link:hover {
		color: #a08960;
	}

	.price-summary-compact {
		background: #f5f5f0;
		padding: 1rem 1.5rem;
		border-radius: 10px;
		margin: 1.5rem 0;
		text-align: center;
	}

	.price-row {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.error-banner {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
		padding: 1rem;
		border-radius: 10px;
		margin: 1rem 0;
		font-size: 0.9375rem;
		font-weight: 500;
	}

	.submit-btn {
		width: 100%;
		padding: 1rem 2rem;
		background: #1a1a1a;
		color: white;
		border: none;
		border-radius: 2px;
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-top: 1rem;
	}

	.submit-btn:hover:not(:disabled) {
		background: #c4a77d;
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

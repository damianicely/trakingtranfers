<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	$: t = translations[$language];

	export let basicDetails: { // TODO: add type for basicDetails
		firstName: string;
		lastName: string;
		bookingNames: string;
		email: string;
		phone: string;
	};

	export let fieldErrors: Record<string, string>;
	export let validateField: (fieldName: string, value: string) => void;
	export let onEmailBlur: (() => void) | undefined = undefined;
	/** When true, show "Log in" link next to email error (email already registered). */
	export let emailAlreadyRegistered: boolean = false;
	export let onOpenLogin: (() => void) | undefined = undefined;
	/** When set, email is read-only and first/last/phone are hidden; only "other booking names" editable. */
	export let loggedInUser: { username: string } | null = null;
</script>

<div class="booking-step basic-details-modern">
	<form class="booking-form modern-form" onsubmit={(e) => { e.preventDefault(); }}>
		{#if !loggedInUser}
			<div class="name-row">
				<div class="form-group modern-group">
					<label for="firstName" class="form-label modern-label">{t.booking_first_name_label}</label>
					<input
						type="text"
						id="firstName"
						class="form-input modern-input"
						class:error={fieldErrors.firstName}
						placeholder={t.booking_first_name_placeholder}
						bind:value={basicDetails.firstName}
						onblur={() => validateField('firstName', basicDetails.firstName)}
					/>
					{#if fieldErrors.firstName}
						<span class="error-message modern-error">{fieldErrors.firstName}</span>
					{/if}
				</div>

				<div class="form-group modern-group">
					<label for="lastName" class="form-label modern-label">{t.booking_last_name_label}</label>
					<input
						type="text"
						id="lastName"
						class="form-input modern-input"
						class:error={fieldErrors.lastName}
						placeholder={t.booking_last_name_placeholder}
						bind:value={basicDetails.lastName}
						onblur={() => validateField('lastName', basicDetails.lastName)}
					/>
					{#if fieldErrors.lastName}
						<span class="error-message modern-error">{fieldErrors.lastName}</span>
					{/if}
				</div>
			</div>
		{/if}

		<div class="form-group modern-group">
			<label for="email" class="form-label modern-label">{t.booking_email_label}</label>
			<input
				type="email"
				id="email"
				class="form-input modern-input"
				class:error={fieldErrors.email}
				class:readonly-field={!!loggedInUser}
				placeholder={t.booking_email_placeholder}
				bind:value={basicDetails.email}
				readonly={!!loggedInUser}
				onblur={() => {
					if (!loggedInUser) {
						validateField('email', basicDetails.email);
						if (basicDetails.email?.trim()) onEmailBlur?.();
					}
				}}
			/>
			{#if fieldErrors.email}
				<span class="error-message modern-error">{fieldErrors.email}</span>
				{#if emailAlreadyRegistered && onOpenLogin}
					<button type="button" class="link-button login-prompt-btn" onclick={onOpenLogin}>Log in</button>
				{/if}
			{/if}
		</div>

		{#if !loggedInUser}
			<div class="form-group modern-group">
				<label for="phone" class="form-label modern-label">{t.booking_phone_label}</label>
				<input
					type="tel"
					id="phone"
					class="form-input modern-input"
					class:error={fieldErrors.phone}
					placeholder={t.booking_phone_placeholder}
					bind:value={basicDetails.phone}
					onblur={() => validateField('phone', basicDetails.phone)}
				/>
				{#if fieldErrors.phone}
					<span class="error-message modern-error">{fieldErrors.phone}</span>
				{/if}
			</div>
		{/if}

		<div class="form-group modern-group">
			<label for="bookingNames" class="form-label modern-label">{t.booking_names_label}</label>
			<p class="field-help-text">{t.booking_names_help_text}</p>
			<input
				type="text"
				id="bookingNames"
				class="form-input modern-input"
				placeholder={t.booking_names_placeholder}
				bind:value={basicDetails.bookingNames}
			/>
		</div>

	</form>
</div>

<style>
	.booking-step {
		min-height: 300px;
	}

	.booking-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Flat design styling */
	.basic-details-modern .modern-form {
		background: transparent;
		padding: 0;
	}

	.name-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.modern-group {
		margin-bottom: 2rem;
	}

	.modern-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #333;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.5rem;
		display: block;
	}

	.modern-input {
		padding: 0.875rem 0;
		border: none;
		border-bottom: 2px solid #e0e0e0;
		border-radius: 0;
		font-size: 1rem;
		background: transparent;
		transition: border-color 0.2s ease;
		width: 100%;
		font-family: inherit;
	}

	.modern-input:focus {
		outline: none;
		border-bottom-color: #007bff;
	}

	.modern-input.error {
		border-bottom-color: #dc3545;
	}

	.modern-input.readonly-field {
		background: #f5f5f5;
		color: #555;
		cursor: default;
	}

	.modern-error {
		color: #dc3545;
		font-size: 0.8125rem;
		margin-top: 0.5rem;
		font-weight: 500;
	}

	.login-prompt-btn {
		margin-top: 0.35rem;
		display: inline-block;
		background: none;
		border: none;
		color: #007bff;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		text-decoration: underline;
	}

	.login-prompt-btn:hover {
		color: #0056b3;
	}

	.field-help-text {
		font-size: 0.875rem;
		color: #6c757d;
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.name-row {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
</style>

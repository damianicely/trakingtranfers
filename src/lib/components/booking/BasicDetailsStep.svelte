<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	$: t = translations[$language];

	export let basicDetails: {
		firstName: string;
		lastName: string;
		bookingNames: string;
		email: string;
		phone: string;
	};

	export let fieldErrors: Record<string, string>;
	export let validateField: (fieldName: string, value: string) => void;
</script>

<div class="booking-step basic-details-modern">
	<h3 class="step-title">{t.booking_step_basic_details_title}</h3>
	<form class="booking-form modern-form" onsubmit={(e) => { e.preventDefault(); }}>
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

		<div class="form-group modern-group">
			<label for="email" class="form-label modern-label">{t.booking_email_label}</label>
			<input
				type="email"
				id="email"
				class="form-input modern-input"
				class:error={fieldErrors.email}
				placeholder={t.booking_email_placeholder}
				bind:value={basicDetails.email}
				onblur={() => validateField('email', basicDetails.email)}
			/>
			{#if fieldErrors.email}
				<span class="error-message modern-error">{fieldErrors.email}</span>
			{/if}
		</div>

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

	/* Modern styling for Step 1 (Basic Details) */
	.basic-details-modern .modern-form {
		background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
		padding: 2.5rem;
		border-radius: 16px;
		border: 1px solid #e9ecef;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.name-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
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

	.field-help-text {
		font-size: 0.875rem;
		color: #6c757d;
		margin: 0 0 0.75rem 0;
		line-height: 1.5;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.basic-details-modern .modern-form {
			padding: 1.5rem;
		}

		.name-row {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
</style>

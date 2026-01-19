<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	$: t = translations[$language];

	export let accommodation: {
		provideLater: boolean;
		hotels: Array<{
			nightIndex: number;
			locationId: string;
			locationName: string;
			checkInDate: string;
			checkInDateFormatted: string;
			name: string;
			address: string;
		}>;
	};

	export let fieldErrors: Record<string, string>;
	export let validateAccommodation: () => void;

	function handleProvideLaterChange() {
		if (accommodation.provideLater) {
			// Clear hotel errors when providing later
			Object.keys(fieldErrors).forEach((key) => {
				if (key.startsWith('hotel_')) {
					delete fieldErrors[key];
				}
			});
			fieldErrors = { ...fieldErrors };
		}
	}
</script>

<div class="booking-step basic-details-modern">
	<h3 class="step-title">{t.booking_step_accommodation_title}</h3>
	<form class="booking-form modern-form" onsubmit={(e) => { e.preventDefault(); }}>
		<div class="accommodation-later-group">
			<label class="checkbox-label">
				<input
					type="checkbox"
					bind:checked={accommodation.provideLater}
					onchange={handleProvideLaterChange}
				/>
				<span>{t.booking_accommodation_later_label}</span>
			</label>
			<p class="accommodation-warning">{t.booking_accommodation_warning}</p>
		</div>

		{#if !accommodation.provideLater}
			{#if accommodation.hotels.length === 0}
				<p class="accommodation-loading">Please complete Step 2 to see accommodation details.</p>
			{:else if accommodation.hotels.length > 0}
				<div class="hotels-container">
					{#each accommodation.hotels as hotel, index}
						{@const isComplete = hotel.name.trim() && hotel.address.trim()}
						<div class="hotel-section" class:complete={isComplete} class:incomplete={!isComplete}>
							<div class="hotel-header">
								<div class="hotel-header-left">
									<span class="hotel-status-icon">
										{#if isComplete}✓{/if}
										{#if !isComplete}✗{/if}
									</span>
									<span class="hotel-label">
										{hotel.locationName} - {hotel.checkInDateFormatted}
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
								<div class="form-group modern-group">
									<label for="hotel_name_{index}" class="form-label modern-label">{t.booking_hotel_name_label}</label>
									<input
										type="text"
										id="hotel_name_{index}"
										class="form-input modern-input"
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
										<span class="error-message modern-error">{fieldErrors[`hotel_${index}_name`]}</span>
									{/if}
								</div>

								<div class="form-group modern-group">
									<label for="hotel_contact_{index}" class="form-label modern-label">{t.booking_hotel_contact_label}</label>
									<input
										type="text"
										id="hotel_contact_{index}"
										class="form-input modern-input"
										class:error={fieldErrors[`hotel_${index}_contact`]}
										placeholder={t.booking_hotel_contact_placeholder}
										bind:value={hotel.address}
										onblur={() => {
											if (hotel.address.trim()) {
												delete fieldErrors[`hotel_${index}_contact`];
												fieldErrors = { ...fieldErrors };
											} else {
												validateAccommodation();
											}
										}}
									/>
									{#if fieldErrors[`hotel_${index}_contact`]}
										<span class="error-message modern-error">{fieldErrors[`hotel_${index}_contact`]}</span>
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

	/* Flat design styling */
	.basic-details-modern .modern-form {
		background: transparent;
		padding: 0;
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

	.modern-error {
		color: #dc3545;
		font-size: 0.8125rem;
		margin-top: 0.5rem;
		font-weight: 500;
	}

	/* Accommodation specific styles - flat design */
	.accommodation-later-group {
		margin-bottom: 2rem;
		padding: 0;
		background: transparent;
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
		color: #666;
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
		border: none;
		border-bottom: 2px solid #e0e0e0;
		overflow: visible;
		transition: border-color 0.2s ease;
		padding-bottom: 1rem;
		margin-bottom: 1.5rem;
	}

	.hotel-section.complete {
		border-bottom-color: #28a745;
	}

	.hotel-section.incomplete {
		border-bottom-color: #e0e0e0;
	}

	.hotel-header {
		width: 100%;
		padding: 1rem 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-align: left;
		font-size: 1rem;
		cursor: pointer;
		background: transparent;
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
		border-radius: 0;
		flex-shrink: 0;
	}

	.hotel-section.complete .hotel-status-icon {
		color: #28a745;
		background: transparent;
	}

	.hotel-section.incomplete .hotel-status-icon {
		color: #999;
		background: transparent;
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
		padding: 1.5rem 0;
		background: transparent;
		border-top: none;
	}

	@media (max-width: 768px) {
		.accommodation-warning {
			margin-left: 0;
			margin-top: 0.5rem;
		}
	}
</style>

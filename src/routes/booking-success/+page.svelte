<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { STAGES, formatDate } from '$lib/trail';

	let { data } = $props();

	const { booking, segments, passwordResetUrl } = data;

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

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		alert('Link copied to clipboard!');
	};
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="success-page">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-bg">
			<img src="/images/optimized_pier.jpg" alt="Coastal pier at sunset" class="hero-image-left" />
			<img
				src="/images/optimized_cistus.jpg"
				alt="Wild cistus flowers on the trail"
				class="hero-image-right"
			/>
			<div class="hero-overlay"></div>
		</div>
		<div class="hero-content">
			<div class="success-badge">
				<svg
					class="check-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
				>
					<path d="M20 6L9 17l-5-5" />
				</svg>
			</div>
			<p class="hero-subtitle">Booking Confirmed</p>
			<h1 class="hero-title">Thank You</h1>
			<p class="hero-description">
				Your luggage transport has been successfully booked. We've sent a confirmation email with
				all the details.
			</p>
		</div>
		<div class="scroll-indicator">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</div>
	</section>

	<!-- Password Reset Section -->
	{#if passwordResetUrl}
		<section class="password-section">
			<div class="container">
				<div class="password-card">
					<div class="password-header">
						<span class="password-icon">🔐</span>
						<p class="section-label">Account Setup</p>
						<h2 class="section-title">Set Up Your Password</h2>
					</div>
					<p class="password-description">
						We've created an account for you. Use the link below to set your password and manage
						your bookings.
					</p>
					<div class="password-link-container">
						<div class="password-link-wrapper">
							<input type="text" readonly value={passwordResetUrl} class="password-link-input" />
							<button
								class="copy-btn"
								on:click={() => copyToClipboard(passwordResetUrl)}
								title="Copy link"
							>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
									<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
								</svg>
							</button>
						</div>
						<a href={passwordResetUrl} class="setup-btn">Set Your Password</a>
					</div>
					<p class="password-note">This link expires in 24 hours</p>
				</div>
			</div>
		</section>
	{/if}

	<!-- Booking Details Section -->
	<section class="details-section">
		<div class="container">
			<div class="section-header">
				<p class="section-label">Booking Details</p>
				<h2 class="section-title">Your Reservation</h2>
			</div>

			<div class="details-grid">
				<!-- Customer Card -->
				<div class="detail-card">
					<div class="card-header">
						<svg
							class="card-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
							<circle cx="12" cy="7" r="4"></circle>
						</svg>
						<h3>{t.booking_success_customer_title}</h3>
					</div>
					<div class="card-content">
						<div class="detail-row">
							<span class="detail-label">{t.booking_success_name}</span>
							<span class="detail-value">
								{(booking.userFirstName ?? booking.firstName) || ''}
								{(booking.userLastName ?? booking.lastName) || ''}
							</span>
						</div>
						{#if booking.bookingOtherNames}
							<div class="detail-row">
								<span class="detail-label">{t.booking_success_other_names}</span>
								<span class="detail-value">{booking.bookingOtherNames}</span>
							</div>
						{/if}
						<div class="detail-row">
							<span class="detail-label">{t.booking_success_email}</span>
							<span class="detail-value">{booking.email || '—'}</span>
						</div>
						{#if booking.phone}
							<div class="detail-row">
								<span class="detail-label">{t.booking_success_phone}</span>
								<span class="detail-value">{booking.phone}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Trip Card -->
				<div class="detail-card">
					<div class="card-header">
						<svg
							class="card-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 16 14"></polyline>
						</svg>
						<h3>{t.booking_success_trip_title}</h3>
					</div>
					<div class="card-content">
						<div class="detail-row">
							<span class="detail-label">{t.booking_success_departure_date}</span>
							<span class="detail-value highlight">{formatDateString(booking.departureDate)}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">{t.booking_success_route}</span>
							<span class="detail-value">
								{stageNames[booking.departureStageId || ''] || booking.departureStageId || '—'} →
								{stageNames[booking.destinationStageId || ''] || booking.destinationStageId || '—'}
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">{t.booking_success_transfers}</span>
							<span class="detail-value">{booking.numTransfers || '0'} legs</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">{t.booking_success_bags}</span>
							<span class="detail-value">{booking.numBags || '0'} bags</span>
						</div>
						<div class="detail-row price-row">
							<span class="detail-label">{t.booking_success_total_price}</span>
							<span class="price-value">€{booking.totalPrice || '0'}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Itinerary -->
			{#if segments && segments.length > 0}
				<div class="itinerary-card">
					<div class="card-header">
						<svg
							class="card-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polygon points="1 6 1 22 8 18 16 22 21 18 21 6 16 10 8 6 1 10"></polygon>
						</svg>
						<h3>{t.booking_success_itinerary_title}</h3>
					</div>
					<div class="timeline">
						{#each segments as segment, index}
							<div class="timeline-item">
								<div class="timeline-marker">{index + 1}</div>
								<div class="timeline-content">
									<div class="timeline-date">
										{formatDate(booking.departureDate?.toISOString().split('T')[0] || '', index)}
									</div>
									<div class="timeline-route">
										{stageNames[segment.fromStageId] || segment.fromStageId}
										<span class="arrow">→</span>
										{stageNames[segment.toStageId] || segment.toStageId}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Next Steps -->
			<div class="next-steps">
				<div class="section-header">
					<p class="section-label">What's Next</p>
					<h2 class="section-title">{t.booking_success_next_steps_title}</h2>
				</div>
				<p class="next-steps-text">{t.booking_success_next_steps_message}</p>
			</div>
		</div>
	</section>

	<!-- Action Buttons -->
	<section class="actions-section">
		<div class="container">
			<div class="action-buttons">
				<a href="/" class="btn-secondary">{t.booking_success_back_home}</a>
				{#if booking.userId}
					<a href="/dashboard" class="btn-primary">{t.booking_success_view_dashboard}</a>
				{/if}
			</div>
		</div>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Inter', sans-serif;
	}

	.success-page {
		font-family: 'Inter', sans-serif;
		color: #333333;
		background-color: #ffffff;
		line-height: 1.6;
		overflow-x: hidden;
	}

	/* Hero Section */
	.hero {
		position: relative;
		height: 100vh;
		min-height: 700px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		z-index: -1;
	}

	.hero-image-left,
	.hero-image-right {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: brightness(0.7);
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(26, 26, 26, 0.4) 0%, rgba(26, 26, 26, 0.6) 100%);
	}

	.hero-content {
		text-align: center;
		color: #ffffff;
		max-width: 900px;
		padding: 0 2rem;
		z-index: 1;
	}

	.success-badge {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: #c4a77d;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 2rem;
		box-shadow: 0 10px 40px rgba(196, 167, 125, 0.4);
	}

	.check-icon {
		width: 50px;
		height: 50px;
		color: #ffffff;
	}

	.hero-subtitle {
		font-size: 0.875rem;
		font-weight: 500;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		margin-bottom: 1.5rem;
		opacity: 0.9;
	}

	.hero-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.5rem, 6vw, 5rem);
		font-weight: 400;
		line-height: 1.1;
		margin-bottom: 1.5rem;
		letter-spacing: -0.02em;
	}

	.hero-description {
		font-size: 1.125rem;
		font-weight: 300;
		line-height: 1.8;
		max-width: 600px;
		margin: 0 auto;
		opacity: 0.9;
	}

	.scroll-indicator {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		color: #ffffff;
		opacity: 0.6;
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%,
		20%,
		50%,
		80%,
		100% {
			transform: translateX(-50%) translateY(0);
		}
		40% {
			transform: translateX(-50%) translateY(-10px);
		}
		60% {
			transform: translateX(-50%) translateY(-5px);
		}
	}

	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* Section Header */
	.section-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #c4a77d;
		margin-bottom: 1rem;
	}

	.section-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 400;
		color: #1a1a1a;
		margin: 0;
	}

	/* Password Section */
	.password-section {
		padding: 6rem 2rem;
		background: #f5f5f0;
	}

	.password-card {
		max-width: 700px;
		margin: 0 auto;
		background: #ffffff;
		border-radius: 4px;
		padding: 3rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
		text-align: center;
	}

	.password-header {
		margin-bottom: 1.5rem;
	}

	.password-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.password-description {
		color: #666666;
		font-size: 1.1rem;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.password-link-container {
		background: #f5f5f0;
		border-radius: 4px;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.password-link-wrapper {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.password-link-input {
		flex: 1;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 2px;
		font-size: 0.9rem;
		background: #ffffff;
		color: #333333;
		font-family: inherit;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: #1a1a1a;
		color: #ffffff;
		border: none;
		border-radius: 2px;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.copy-btn:hover {
		background: #c4a77d;
	}

	.copy-btn svg {
		width: 18px;
		height: 18px;
	}

	.setup-btn {
		display: inline-block;
		padding: 1rem 2.5rem;
		background: #c4a77d;
		color: #ffffff;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9375rem;
		letter-spacing: 0.05em;
		transition: all 0.3s ease;
		border-radius: 2px;
	}

	.setup-btn:hover {
		background: #a08960;
		transform: translateY(-2px);
	}

	.password-note {
		color: #999999;
		font-size: 0.9rem;
		margin-top: 1rem;
	}

	/* Details Section */
	.details-section {
		padding: 6rem 2rem;
		background: #ffffff;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.detail-card {
		background: #ffffff;
		border-radius: 4px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.detail-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
		background: #1a1a1a;
		color: #ffffff;
	}

	.card-icon {
		width: 24px;
		height: 24px;
		stroke: #c4a77d;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.card-content {
		padding: 1.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		color: #666666;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.detail-value {
		color: #1a1a1a;
		font-weight: 600;
		text-align: right;
	}

	.detail-value.highlight {
		color: #c4a77d;
		font-size: 1.1rem;
	}

	.price-row {
		padding-top: 1.5rem;
		margin-top: 0.5rem;
		border-top: 2px solid #c4a77d;
		border-bottom: none;
	}

	.price-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #c4a77d;
	}

	/* Itinerary Card */
	.itinerary-card {
		background: #ffffff;
		border-radius: 4px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		margin-bottom: 2rem;
	}

	.timeline {
		padding: 2rem;
	}

	.timeline-item {
		display: flex;
		gap: 1.5rem;
		padding: 1.5rem 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.timeline-item:last-child {
		border-bottom: none;
	}

	.timeline-marker {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #c4a77d;
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		flex-shrink: 0;
	}

	.timeline-content {
		flex: 1;
	}

	.timeline-date {
		color: #c4a77d;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.25rem;
	}

	.timeline-route {
		color: #1a1a1a;
		font-size: 1.1rem;
		font-weight: 500;
	}

	.timeline-route .arrow {
		color: #c4a77d;
		margin: 0 0.5rem;
	}

	/* Next Steps */
	.next-steps {
		background: #f5f5f0;
		border-radius: 4px;
		padding: 3rem;
		text-align: center;
	}

	.next-steps-text {
		color: #666666;
		font-size: 1.1rem;
		line-height: 1.8;
		max-width: 600px;
		margin: 0 auto;
	}

	/* Actions Section */
	.actions-section {
		padding: 3rem 2rem;
		background: #1a1a1a;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.btn-primary,
	.btn-secondary {
		padding: 1rem 2.5rem;
		border-radius: 2px;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9375rem;
		letter-spacing: 0.05em;
		transition: all 0.3s ease;
		display: inline-block;
	}

	.btn-primary {
		background: #c4a77d;
		color: #ffffff;
	}

	.btn-primary:hover {
		background: #a08960;
		transform: translateY(-2px);
	}

	.btn-secondary {
		background: transparent;
		color: #ffffff;
		border: 1px solid #ffffff;
	}

	.btn-secondary:hover {
		background: #ffffff;
		color: #1a1a1a;
		transform: translateY(-2px);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-bg {
			grid-template-columns: 1fr;
		}

		.hero-image-right {
			display: none;
		}

		.hero-title {
			font-size: 2.5rem;
		}

		.password-card {
			padding: 2rem 1.5rem;
		}

		.password-link-wrapper {
			flex-direction: column;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}

		.action-buttons {
			flex-direction: column;
		}

		.btn-primary,
		.btn-secondary {
			width: 100%;
			text-align: center;
		}
	}
</style>

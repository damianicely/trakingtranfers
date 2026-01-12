<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	$: t = translations[$language];

	const scrollToBooking = () => {
		const bookingSection = document.getElementById('booking-section');
		if (bookingSection) {
			bookingSection.scrollIntoView({ behavior: 'smooth' });
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
	<div class="booking-content">
		<h2>{t.booking_section}</h2>
		<p>Booking form will be added here</p>
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
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.booking-content {
		max-width: 800px;
		text-align: center;
	}

	.booking-content h2 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		color: #333;
	}

	.booking-content p {
		font-size: 1.2rem;
		color: #666;
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

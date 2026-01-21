<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import BookingForm from '$lib/components/BookingForm.svelte';

	const t = $derived(translations[$language]);

	const scrollToBooking = () => {
		const bookingSection = document.getElementById('booking-section');
		if (bookingSection) {
			bookingSection.scrollIntoView({ behavior: 'smooth' });
		}
	};
</script>

<section class="hero">
	<div class="hero-image">
		<img src="/hero.png" alt="Fisherman's Trail - TrakingTransfers" />
	</div>
	<button class="book-button" onclick={scrollToBooking}>{t.book_now}</button>
</section>

<section class="about-us">
	<div class="about-container">
		<h2 class="about-title">{t.about_us_title}</h2>
		<h3 class="about-subtitle">{t.about_us_subtitle}</h3>
		<div class="about-content">
			<p class="about-text">{t.about_us_text}</p>
			<p class="about-text">{t.about_us_text_2}</p>
		</div>
	</div>
</section>

<BookingForm />

<section class="gallery">
	<div class="gallery-container">
		<h2 class="gallery-title">{t.gallery_title}</h2>
		<div class="gallery-grid">
			<div class="gallery-item">
				<img src="/g1.png" alt="Fisherman's Trail" />
			</div>
			<div class="gallery-item">
				<img src="/g2.jpg" alt="Fisherman's Trail" />
			</div>
			<div class="gallery-item">
				<img src="/g3.png" alt="Fisherman's Trail" />
			</div>
			<div class="gallery-item">
				<img src="/g4.jpg" alt="Fisherman's Trail" />
			</div>
		</div>
	</div>
</section>

<style>
	.hero {
		position: relative;
		width: 100%;
		height: 100vh;
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
		overflow: hidden;
	}

	.hero-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center center;
	}

	.book-button {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 10;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s;
	}

	.book-button:hover {
		background: #0056b3;
	}

	/* About Us Section */
	.about-us {
		padding: 5rem 2rem;
		background: #ffffff;
	}

	.about-container {
		max-width: 900px;
		margin: 0 auto;
		text-align: center;
	}

	.about-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #333;
		margin-bottom: 1rem;
	}

	.about-subtitle {
		font-size: 1.5rem;
		font-weight: 600;
		color: #007bff;
		margin-bottom: 2rem;
	}

	.about-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		text-align: left;
	}

	.about-text {
		font-size: 1.1rem;
		line-height: 1.8;
		color: #555;
		margin: 0;
	}

	@media (max-width: 768px) {
		.about-us {
			padding: 3rem 1.5rem;
		}

		.about-title {
			font-size: 2rem;
		}

		.about-subtitle {
			font-size: 1.25rem;
		}

		.about-text {
			font-size: 1rem;
		}
	}

	/* Gallery Section */
	.gallery {
		padding: 5rem 2rem;
		background: #f8f9fa;
	}

	.gallery-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.gallery-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #333;
		text-align: center;
		margin-bottom: 3rem;
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.gallery-item {
		position: relative;
		overflow: hidden;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		aspect-ratio: 4 / 3;
		background: #e0e0e0;
	}

	.gallery-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.gallery-item:hover img {
		transform: scale(1.05);
	}

	@media (max-width: 768px) {
		.gallery {
			padding: 3rem 1rem;
		}

		.gallery-title {
			font-size: 2rem;
			margin-bottom: 2rem;
		}

		.gallery-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
	}
</style>

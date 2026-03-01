<script lang="ts">
	import { language } from '$lib/stores/language';
	import BookingForm from './BookingForm.svelte';

	let { user = null }: { user?: { username: string; role: string } | null } = $props();
</script>

<section class="booking-section" id="book">
	<div class="container">
		<div class="section-header">
			<p class="section-label">
				{$language === 'en' ? 'Book Your Transfer' : 'Reserve o Seu Transfer'}
			</p>
			<h2 class="section-title">
				{$language === 'en' ? 'Simple & Reliable' : 'Simples e Confiável'}
			</h2>
			<p class="section-subtitle">
				{$language === 'en'
					? 'Book your luggage transport in minutes. We collect your bags in the morning and deliver them to your next accommodation.'
					: 'Reserve o transporte da sua bagagem em minutos. Recolhemos as suas malas de manhã e entregamos na sua próxima acomodação.'}
			</p>
		</div>

		<div class="booking-form-container">
			<BookingForm {user} />
		</div>
	</div>
</section>

<style>
	@import '$lib/styles/new-landing.css';

	.booking-form-container {
		background: white;
		padding: 3rem;
		border-radius: 16px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
	}

	@media (max-width: 768px) {
		.booking-form-container {
			padding: 1.5rem;
			border-radius: 12px;
		}
	}
</style>

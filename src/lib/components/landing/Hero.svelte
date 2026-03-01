<script lang="ts">
	import { language } from '$lib/stores/language';

	let { t }: { t: (key: string) => string } = $props();
</script>

<section class="hero">
	<div class="hero-bg"></div>
	<div class="hero-content">
		<p class="hero-subtitle">
			{$language === 'en' ? "Fishermen's Trail" : 'Trilho dos Pescadores'}
		</p>
		<h1 class="hero-title">
			{$language === 'en' ? 'Walk Light, Travel Free' : 'Caminhe Leve, Viaje Livre'}
		</h1>
		<p class="hero-description">
			{$language === 'en'
				? 'Professional luggage transport service along the Rota Vicentina. We carry your bags so you can focus on the breathtaking coastal views.'
				: 'Serviço profissional de transporte de bagagem ao longo da Rota Vicentina. Levamos as suas malas para que possa focar nas vistas costeiras deslumbrantes.'}
		</p>
		<a href="#book" class="hero-cta"
			>{$language === 'en' ? 'Book Transport' : 'Reservar Transporte'}</a
		>
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

<style>
	@import '$lib/styles/new-landing.css';
</style>

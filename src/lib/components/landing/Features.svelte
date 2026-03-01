<script lang="ts">
	import { language } from '$lib/stores/language';
</script>

<section class="features-section">
	<div class="container">
		<div class="section-header">
			<p class="section-label">{$language === 'en' ? 'Why Choose Us' : 'Porquê Nós'}</p>
			<h2 class="section-title">
				{$language === 'en' ? 'Your Journey, Our Care' : 'A Sua Jornada, O Nosso Cuidado'}
			</h2>
		</div>

		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke-width="2">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
					</svg>
				</div>
				<h3 class="feature-title">{$language === 'en' ? 'Fully Insured' : 'Totalmente Seguro'}</h3>
				<p class="feature-description">
					{$language === 'en'
						? 'Your luggage is fully insured during transport. Travel with complete peace of mind.'
						: 'A sua bagagem está totalmente segurada durante o transporte. Viaje com total tranquilidade.'}
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
				</div>
				<h3 class="feature-title">
					{$language === 'en' ? 'On Time, Every Time' : 'Na Hora, Sempre'}
				</h3>
				<p class="feature-description">
					{$language === 'en'
						? 'We guarantee delivery before 4 PM to your next accommodation. Reliable service you can count on.'
						: 'Garantimos entrega antes das 16h na sua próxima acomodação. Serviço confiável em quem pode contar.'}
				</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke-width="2">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
						<circle cx="12" cy="10" r="3"></circle>
					</svg>
				</div>
				<h3 class="feature-title">
					{$language === 'en' ? 'Local Expertise' : 'Conhecimento Local'}
				</h3>
				<p class="feature-description">
					{$language === 'en'
						? 'Deep knowledge of the Rota Vicentina trail and all accommodations along the route.'
						: 'Conhecimento profundo do trilho da Rota Vicentina e de todas as acomodações ao longo do percurso.'}
				</p>
			</div>
		</div>
	</div>
</section>

<style>
	@import '$lib/styles/new-landing.css';
</style>

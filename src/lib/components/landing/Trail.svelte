<script lang="ts">
	import { language } from '$lib/stores/language';
</script>

<section class="trail-section">
	<div class="container">
		<div class="trail-grid">
			<div class="trail-content">
				<p class="trail-label">{$language === 'en' ? 'The Trail' : 'O Trilho'}</p>
				<h2 class="trail-title">
					{$language === 'en'
						? "Rota Vicentina Fishermen's Trail"
						: 'Trilho dos Pescadores da Rota Vicentina'}
				</h2>
				<p class="trail-description">
					{$language === 'en'
						? "One of the world's most beautiful coastal trails. 226.5 kilometers of stunning cliffs, wild beaches, and traditional fishing villages along Portugal's unspoiled southwest coast."
						: 'Um dos trilhos costeiros mais bonitos do mundo. 226,5 quilómetros de falésias deslumbrantes, praias selvagens e aldeias de pesca tradicionais ao longo da costa sudoeste de Portugal.'}
				</p>

				<div class="trail-stats">
					<div class="stat-item">
						<div class="stat-value">226.5</div>
						<div class="stat-label">{$language === 'en' ? 'Kilometers' : 'Quilómetros'}</div>
					</div>
					<div class="stat-item">
						<div class="stat-value">13</div>
						<div class="stat-label">{$language === 'en' ? 'Stages' : 'Etapas'}</div>
					</div>
					<div class="stat-item">
						<div class="stat-value">100%</div>
						<div class="stat-label">{$language === 'en' ? 'Coastal' : 'Costeiro'}</div>
					</div>
				</div>
			</div>
			<div class="trail-image">
				<img
					src="/images/leon-rohrwild-7aq46hf4wJY-unsplash.jpg"
					alt="Rota Vicentina aerial beach view"
				/>
			</div>
		</div>
	</div>
</section>

<style>
	@import '$lib/styles/new-landing.css';
</style>

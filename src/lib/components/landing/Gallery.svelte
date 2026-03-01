<script lang="ts">
	import { language } from '$lib/stores/language';
</script>

<section class="gallery-section">
	<div class="container">
		<div class="section-header">
			<p class="section-label">{$language === 'en' ? 'Gallery' : 'Galeria'}</p>
			<h2 class="section-title">{$language === 'en' ? 'Along the Way' : 'Ao Longo do Caminho'}</h2>
		</div>

		<div class="gallery-grid">
			<div class="gallery-item">
				<img src="/images/joao-rodrigues-AKt789CU5Ic-unsplash.jpg" alt="Beach path with flowers" />
				<div class="gallery-overlay">
					<h3 class="gallery-title">São Torpes</h3>
				</div>
			</div>
			<div class="gallery-item">
				<img src="/images/joao-rodrigues--ARsqDCL_-Y-unsplash.jpg" alt="Street scene" />
				<div class="gallery-overlay">
					<h3 class="gallery-title">Vila Nova de Milfontes</h3>
				</div>
			</div>
			<div class="gallery-item">
				<img src="/images/mario-rui-andre-wYneCiecBEo-unsplash.jpg" alt="Portuguese house" />
				<div class="gallery-overlay">
					<h3 class="gallery-title">Zambujeira do Mar</h3>
				</div>
			</div>
			<div class="gallery-item">
				<img src="/images/joao-rodrigues-32a1R1oqwNo-unsplash.jpg" alt="Aerial coastal road" />
				<div class="gallery-overlay">
					<h3 class="gallery-title">Odeceixe</h3>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@import '$lib/styles/new-landing.css';
</style>

<script lang="ts">
	import { language } from '$lib/stores/language';
</script>

<footer class="footer">
	<div class="container">
		<div class="footer-grid">
			<div class="footer-brand">
				<div class="footer-logo">Traking</div>
				<p class="footer-description">
					{$language === 'en'
						? 'Professional luggage transport service for walkers on the Rota Vicentina. Walk light, travel free.'
						: 'Serviço profissional de transporte de bagagem para caminhantes na Rota Vicentina. Caminhe leve, viaje livre.'}
				</p>
			</div>

			<div class="footer-column">
				<h4 class="footer-title">{$language === 'en' ? 'Services' : 'Serviços'}</h4>
				<ul class="footer-links">
					<li>
						<a href="#">{$language === 'en' ? 'Luggage Transport' : 'Transporte de Bagagem'}</a>
					</li>
					<li><a href="#">{$language === 'en' ? 'Group Bookings' : 'Reservas de Grupo'}</a></li>
					<li>
						<a href="#">{$language === 'en' ? 'Custom Transfers' : 'Transferes Personalizados'}</a>
					</li>
					<li><a href="#">{$language === 'en' ? 'Trail Support' : 'Apoio no Trilho'}</a></li>
				</ul>
			</div>

			<div class="footer-column">
				<h4 class="footer-title">{$language === 'en' ? 'Company' : 'Empresa'}</h4>
				<ul class="footer-links">
					<li><a href="#">{$language === 'en' ? 'About Us' : 'Sobre Nós'}</a></li>
					<li><a href="#">{$language === 'en' ? 'Contact' : 'Contacto'}</a></li>
					<li><a href="#">FAQ</a></li>
					<li>
						<a href="#">{$language === 'en' ? 'Terms & Conditions' : 'Termos e Condições'}</a>
					</li>
				</ul>
			</div>

			<div class="footer-column">
				<h4 class="footer-title">{$language === 'en' ? 'Contact' : 'Contacto'}</h4>
				<ul class="footer-links">
					<li>info@trakingtransfers.com</li>
					<li>+351 000 000 000</li>
					<li>{$language === 'en' ? 'Southwest Portugal' : 'Sudoeste de Portugal'}</li>
				</ul>
			</div>
		</div>

		<div class="footer-bottom">
			<p class="footer-copyright">
				&copy; 2025 Traking Transfers. {$language === 'en'
					? 'All rights reserved.'
					: 'Todos os direitos reservados.'}
			</p>
			<a href="https://www.livroreclamacoes.pt" target="_blank" class="livro-reclamacoes">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
					<polyline points="10 9 9 9 8 9"></polyline>
				</svg>
				<span>{$language === 'en' ? 'Livro de Reclamações' : 'Livro de Reclamações'}</span>
			</a>
		</div>
	</div>
</footer>

<style>
	@import '$lib/styles/new-landing.css';
</style>

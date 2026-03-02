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
						<a href="/book">{$language === 'en' ? 'Luggage Transport' : 'Transporte de Bagagem'}</a>
					</li>
					<li>
						<a href="/group-bookings"
							>{$language === 'en' ? 'Group Bookings' : 'Reservas de Grupo'}</a
						>
					</li>
					<li>
						<a href="/group-bookings"
							>{$language === 'en' ? 'Custom Transfers' : 'Transferes Personalizados'}</a
						>
					</li>
					<li><a href="/faq">{$language === 'en' ? 'Trail Support' : 'Apoio no Trilho'}</a></li>
				</ul>
			</div>

			<div class="footer-column">
				<h4 class="footer-title">{$language === 'en' ? 'Company' : 'Empresa'}</h4>
				<ul class="footer-links">
					<li><a href="/about">{$language === 'en' ? 'About Us' : 'Sobre Nós'}</a></li>
					<li>
						<a href="mailto:info@trakingtransfers.com"
							>{$language === 'en' ? 'Contact' : 'Contacto'}</a
						>
					</li>
					<li><a href="/faq">FAQ</a></li>
					<li>
						<a href="/terms">{$language === 'en' ? 'Terms & Conditions' : 'Termos e Condições'}</a>
					</li>
				</ul>
			</div>

			<div class="footer-column">
				<h4 class="footer-title">{$language === 'en' ? 'Contact' : 'Contacto'}</h4>
				<ul class="footer-links">
					<li>info@trakingtransfers.com</li>
					<li>+351 966 611 837</li>
					<li>Monte Salema, 8650-435, Vila do Bispo</li>
					<li>RNAVT | 13137</li>
				</ul>
				<div class="footer-social">
					<a
						href="https://instagram.com/trakingtransfers"
						target="_blank"
						rel="noopener noreferrer"
						class="social-link"
						aria-label="Instagram"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
							<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
							<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
						</svg>
					</a>
					<a
						href="https://facebook.com/trakingtransfers"
						target="_blank"
						rel="noopener noreferrer"
						class="social-link"
						aria-label="Facebook"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
						</svg>
					</a>
				</div>
			</div>
		</div>

		<div class="footer-bottom">
			<p class="footer-copyright">
				&copy; 2026 Traking Transfers. {$language === 'en'
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

<script lang="ts">
	import { STAGES } from '$lib/trail';

	let { data } = $props();

	const stageNames = Object.fromEntries(STAGES.map((s) => [s.id, s.name]));
	const booking = $derived(data.booking);
	const bags = $derived(data.bags);
</script>

<div class="bag-links-page">
	<nav class="breadcrumb">
		<a href="/dashboard">Dashboard</a>
		<span>/</span>
		<a href="/dashboard">Bookings</a>
		<span>/</span>
		<span>Booking #{booking.shortRef} — Bag links</span>
	</nav>

	<h1>Bag links for booking #{booking.shortRef}</h1>
	<p class="hint">
		Use these URLs for QR codes or labels. Each link opens the driver bag page (pick up / deliver).
	</p>

	{#if bags.length === 0}
		<p class="empty">No bags for this booking yet. Bags are created when the booking is paid.</p>
	{:else}
		<ul class="bag-url-list">
			{#each bags as bag}
				<li class="bag-url-item">
					<span class="bag-label">Bag {bag.label}</span>
					<code class="bag-url">{bag.driverUrl}</code>
					<a href={bag.driverUrl} target="_blank" rel="noopener noreferrer" class="open-link">Open</a>
				</li>
			{/each}
		</ul>
		<p class="print-hint">Print this page or copy the URLs to generate QR codes for bag labels.</p>
	{/if}
</div>

<style>
	.bag-links-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.breadcrumb {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 1rem;
	}
	.breadcrumb a {
		color: #0d6efd;
		text-decoration: none;
	}
	.breadcrumb a:hover {
		text-decoration: underline;
	}
	.bag-links-page h1 {
		font-size: 1.5rem;
		margin: 0 0 0.5rem 0;
	}
	.hint {
		color: #666;
		margin: 0 0 1.5rem 0;
		font-size: 0.95rem;
	}
	.empty {
		color: #666;
		font-style: italic;
	}
	.bag-url-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.bag-url-item {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #eee;
	}
	.bag-label {
		font-weight: 600;
		min-width: 5rem;
	}
	.bag-url {
		flex: 1;
		min-width: 200px;
		font-size: 0.85rem;
		background: #f5f5f5;
		padding: 0.35rem 0.5rem;
		border-radius: 4px;
		word-break: break-all;
	}
	.open-link {
		color: #0d6efd;
		text-decoration: none;
		font-size: 0.9rem;
	}
	.open-link:hover {
		text-decoration: underline;
	}
	.print-hint {
		margin-top: 1.5rem;
		font-size: 0.9rem;
		color: #666;
	}
</style>

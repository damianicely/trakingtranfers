<script lang="ts">
	import { page } from '$app/stores';

	const slug = $derived($page.params.slug);
	const title = $derived(slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
</script>

<div class="admin-section">
	<header class="page-header">
		<h1 class="page-title">{title}</h1>
		<p class="page-subtitle">Content for this section</p>
	</header>
	<section class="intro-block">
		<p class="lead">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
		</p>
		<p>
			Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident. Curabitur pretium tincidunt lacus; nulla facilisi.
		</p>
	</section>
</div>

<style>
	.admin-section {
		max-width: 960px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 600;
		color: #1a1d21;
		letter-spacing: -0.02em;
		margin: 0 0 0.25rem 0;
	}

	.page-subtitle {
		font-size: 0.9375rem;
		color: #5f6368;
		margin: 0;
		font-weight: 500;
	}

	.intro-block {
		background: #fff;
		border-radius: 10px;
		padding: 1.5rem 1.75rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.intro-block .lead {
		font-size: 1.0625rem;
		line-height: 1.65;
		color: #1a1d21;
		margin: 0 0 1rem 0;
		font-weight: 500;
	}

	.intro-block p {
		font-size: 0.9375rem;
		line-height: 1.65;
		color: #3c4043;
		margin: 0;
	}
</style>

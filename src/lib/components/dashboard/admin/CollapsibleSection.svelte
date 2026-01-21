<script lang="ts">
	let { title, defaultExpanded = false } = $props<{
		title: string;
		defaultExpanded?: boolean;
	}>();

	let isExpanded = $state(defaultExpanded);

	const toggle = () => {
		isExpanded = !isExpanded;
	};
</script>

<div class="collapsible-section">
	<button type="button" class="section-header" onclick={toggle}>
		<span class="toggle-icon">{isExpanded ? '−' : '+'}</span>
		<h2>{title}</h2>
	</button>
	{#if isExpanded}
		<div class="section-content">
			<slot />
		</div>
	{/if}
</div>

<style>
	.collapsible-section {
		width: 100%;
		margin-bottom: 2rem;
		background: white;
		border-radius: 4px;
		overflow: hidden;
	}

	.section-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: #f8f9fa;
		border: none;
		border-bottom: 1px solid #e0e0e0;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.2s;
	}

	.section-header:hover {
		background: #e9ecef;
	}

	.toggle-icon {
		font-size: 1.5rem;
		font-weight: 300;
		line-height: 1;
		color: #666;
		min-width: 1.5rem;
		text-align: center;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.section-content {
		padding: 1.5rem;
	}
</style>

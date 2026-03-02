<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import CustomersTable from '$lib/components/dashboard/admin/CustomersTable.svelte';

	let { data, form } = $props();

	const t = $derived(translations[$language]);
</script>

<div class="admin-customers">
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.admin_nav_customers}</h1>
	</div>

	<!-- Table Container -->
	<div class="data-table-container">
		<CustomersTable customers={data.customers ?? []} {form} />
	</div>
</div>

<style>
	.admin-customers {
		width: 100%;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-family: var(--font-heading, 'Playfair Display', serif);
		font-size: 2rem;
		font-weight: 500;
		color: var(--color-primary, #1a1a1a);
		margin: 0;
	}

	.data-table-container {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}
</style>

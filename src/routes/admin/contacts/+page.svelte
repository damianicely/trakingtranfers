<script lang="ts">
	import CustomersTable from '$lib/components/dashboard/admin/CustomersTable.svelte';

	let { data, form } = $props();
</script>

<div class="admin-customers">
	<section class="content-section">
		<div class="table-wrapper">
			<div class="table-inner">
				<CustomersTable customers={data.customers ?? []} {form} />
			</div>
		</div>
	</section>
</div>

<style>
	.admin-customers {
		max-width: 960px;
		margin: 0 auto;
	}

	.content-section {
		margin-bottom: 2rem;
	}

	.table-wrapper {
		background: #fff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.table-inner {
		padding: 1.5rem;
	}
</style>


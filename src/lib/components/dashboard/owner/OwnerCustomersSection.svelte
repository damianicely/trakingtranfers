<script lang="ts">
	import CustomersTable from '$lib/components/dashboard/admin/CustomersTable.svelte';

	let { data } = $props<{
		data: {
			allCustomers?: Array<{ id: string; username: string; role: string }>;
			form?: { success?: boolean; message?: string };
		};
	}>();
</script>

<div class="owner-customers-section">
	<CustomersTable customers={data.allCustomers ?? []} form={data.form} />
</div>

<style>
	.owner-customers-section {
		width: 100%;
		max-width: 100%;
	}
</style>

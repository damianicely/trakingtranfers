<script lang="ts">
	import BookingsTable from '$lib/components/dashboard/admin/BookingsTable.svelte';

	let { data } = $props<{
		data: {
			allBookings?: Array<any>;
			form?: { success?: boolean; message?: string };
		};
	}>();
</script>

<div class="owner-bookings-section">
	<BookingsTable bookings={data.allBookings ?? []} form={data.form} />
</div>

<style>
	.owner-bookings-section {
		width: 100%;
		max-width: 100%;
	}
</style>

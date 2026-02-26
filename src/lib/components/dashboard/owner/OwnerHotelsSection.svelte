<script lang="ts">
	import HotelsTable from '$lib/components/dashboard/admin/HotelsTable.svelte';

	let { data } = $props<{
		data: {
			hotels?: Array<{ id: string; locationId: string; name: string; contactInfo: string | null }>;
			hotelsByLocation?: Record<string, Array<{ id: string; name: string; contactInfo: string | null }>>;
			form?: { success?: boolean; message?: string };
		};
	}>();
</script>

<div class="owner-hotels-section">
	<HotelsTable
		hotels={data.hotels ?? []}
		hotelsByLocation={data.hotelsByLocation ?? {}}
		form={data.form}
	/>
</div>

<style>
	.owner-hotels-section {
		width: 100%;
		max-width: 100%;
	}
</style>

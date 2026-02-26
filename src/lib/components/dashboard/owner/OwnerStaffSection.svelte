<script lang="ts">
	import StaffSection from '$lib/components/dashboard/admin/StaffSection.svelte';

	let { data } = $props<{
		data: {
			allStaff?: Array<{
				id: string;
				username: string;
				firstName: string | null;
				lastName: string | null;
				role: string;
				licenseNumber: string | null;
			}>;
			form?: { success?: boolean; message?: string };
		};
	}>();
</script>

<div class="owner-staff-section">
	<StaffSection allStaff={data.allStaff ?? []} form={data.form} />
</div>

<style>
	.owner-staff-section {
		width: 100%;
	}
</style>

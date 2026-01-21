<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import AccountInfo from './AccountInfo.svelte';
	import CollapsibleSection from './admin/CollapsibleSection.svelte';
	import HotelsTable from './admin/HotelsTable.svelte';
	import BookingsTable from './admin/BookingsTable.svelte';
	import CustomersTable from './admin/CustomersTable.svelte';
	import DriversTable from './admin/DriversTable.svelte';

	let { user, data, form } = $props<{
		user: { username: string; id: string; role: string };
		data: {
			hotels: Array<{ id: string; locationId: string; name: string; contactInfo: string | null }>;
			hotelsByLocation: Record<string, Array<{ id: string; name: string; contactInfo: string | null }>>;
			allBookings: Array<any>;
			allCustomers: Array<any>;
			allDrivers: Array<any>;
		};
		form?: { success?: boolean; message?: string };
	}>();

	const t = $derived(translations[$language]);
</script>

<div class="admin-dashboard">
	<CollapsibleSection title="Hotels" defaultExpanded={true}>
		<HotelsTable hotels={data.hotels} hotelsByLocation={data.hotelsByLocation} {form} />
	</CollapsibleSection>

	<CollapsibleSection title="Bookings">
		<BookingsTable bookings={data.allBookings} {form} />
	</CollapsibleSection>

	<CollapsibleSection title="Customers">
		<CustomersTable customers={data.allCustomers} {form} />
	</CollapsibleSection>

	<CollapsibleSection title="Drivers">
		<DriversTable drivers={data.allDrivers} {form} />
	</CollapsibleSection>

	<AccountInfo {user} roleLabel={t.dashboard_role_admin} />
</div>

<style>
	.admin-dashboard {
		width: 100%;
		max-width: 100%;
	}
</style>

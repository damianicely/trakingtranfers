<script lang="ts">
	import { page } from '$app/stores';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import CustomerDashboard from '$lib/components/dashboard/CustomerDashboard.svelte';
	import DriverDashboard from '$lib/components/dashboard/DriverDashboard.svelte';
	import OwnerShell from '$lib/components/dashboard/owner/OwnerShell.svelte';
	import AdminDashboard from '$lib/components/dashboard/AdminDashboard.svelte';

	let { data, form } = $props();

	const user = $derived(data.user);
	const role = $derived(user.role);

	const t = $derived(translations[$language]);

	const ownerInitialSection = $derived($page.url.searchParams.get('section') ?? 'overview');
</script>

{#if role === 'customer'}
	<CustomerDashboard {user} {data} {form} />
{:else if role === 'owner'}
	<OwnerShell {data} {form} initialSection={ownerInitialSection} />
{:else if role === 'driver'}
	<DriverDashboard {user} {data} />
{:else if role === 'admin'}
	<AdminDashboard {user} {data} {form} />
{/if}

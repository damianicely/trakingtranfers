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

	const roleTitle = $derived.by(() => {
		const roleMap: Record<string, string> = {
			customer: t.dashboard_title_customer,
			owner: t.dashboard_title_owner,
			driver: t.dashboard_title_driver,
			admin: t.dashboard_title_admin
		};
		return roleMap[role] || t.dashboard_title_customer;
	});

	const ownerInitialSection = $derived($page.url.searchParams.get('section') ?? 'overview');
</script>

<div class="dashboard" class:dashboard-owner={role === 'owner'}>
	{#if role !== 'owner'}
		<header class="dashboard-header">
			<h1>{roleTitle}</h1>
			<p class="welcome">{t.dashboard_welcome.replace('{username}', user.username)}</p>
			<form method="POST" action="/logout" class="logout-form">
				<button type="submit">{t.dashboard_logout}</button>
			</form>
		</header>
	{/if}

	<main class="dashboard-content" class:admin-dashboard={role === 'admin' || role === 'owner'}>
		{#if role === 'customer'}
			<CustomerDashboard {user} data={data} {form} />
		{:else if role === 'owner'}
			<OwnerShell data={data} form={form} initialSection={ownerInitialSection} />
		{:else if role === 'driver'}
			<DriverDashboard {user} data={data} />
		{:else if role === 'admin'}
			<AdminDashboard {user} data={data} {form} />
		{/if}
	</main>
</div>

<style>
    .dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

	.dashboard.dashboard-owner {
		max-width: 100%;
		margin: 0;
		padding: 0;
	}

	.dashboard:has(.admin-dashboard) {
		max-width: 100%;
		padding: 2rem;
	}

	.dashboard.dashboard-owner .dashboard-content {
		padding: 0;
	}

    .dashboard-header {
        margin-bottom: 3rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .dashboard-header h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: 600;
        color: #1a1a1a;
    }

    .welcome {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 1rem;
    }

    .logout-form {
        margin: 0;
    }

    .logout-form button {
        padding: 0.5rem 1.5rem;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background-color 0.2s;
    }

    .logout-form button:hover {
        background-color: #c82333;
    }

	.dashboard-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.dashboard-content.admin-dashboard {
		display: block;
		max-width: 100%;
	}

    @media (max-width: 768px) {
        .dashboard {
            padding: 1rem;
        }

        .dashboard-header {
            flex-direction: column;
        }

        .dashboard-content {
            grid-template-columns: 1fr;
        }
    }
</style>
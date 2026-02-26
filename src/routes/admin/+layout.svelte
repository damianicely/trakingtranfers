<script lang="ts">
	import { page } from '$app/stores';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import AdminIcon from '$lib/components/admin/AdminIcon.svelte';

	let { data } = $props();

	const t = $derived(translations[$language]);
	const currentPath = $derived($page.url.pathname);

	const menuItems = $derived([
		{ href: '/admin', labelKey: 'admin_nav_overview', icon: 'dashboard' as const },
		{ href: '/admin/sales', labelKey: 'admin_nav_sales', icon: 'barChart' as const },
		{ href: '/admin/calendar', labelKey: 'admin_nav_schedule', icon: 'calendar' as const },
		{ href: '/admin/team', labelKey: 'admin_nav_team', icon: 'users' as const },
		{ href: '/admin/locations', labelKey: 'admin_nav_accommodation', icon: 'building' as const },
		{ href: '/admin/contacts', labelKey: 'admin_nav_customers', icon: 'userCircle' as const },
		{ href: '/admin/activity', labelKey: 'admin_nav_activity', icon: 'inbox' as const },
		{ href: '/admin/settings', labelKey: 'admin_nav_settings', icon: 'settings' as const }
	]);
</script>

<div class="admin-app">
	<aside class="sidebar">
		<div class="sidebar-brand">
			<span class="brand-text">Admin</span>
		</div>
		<nav class="sidebar-nav">
			{#each menuItems as item}
				<a
					href={item.href}
					class="nav-link"
					class:active={currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href))}
				>
					<AdminIcon name={item.icon} size={20} class="nav-icon" />
					<span class="nav-label">{t[item.labelKey] ?? item.labelKey}</span>
				</a>
			{/each}
		</nav>
		<div class="sidebar-footer">
			<a href="/dashboard" class="nav-link back-link">{t.admin_nav_back_dashboard}</a>
		</div>
	</aside>
	<main class="admin-main">
		<slot />
	</main>
</div>

<style>
	.admin-app {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 240px;
		flex-shrink: 0;
		background: #1a1d21;
		color: #e8eaed;
		display: flex;
		flex-direction: column;
	}

	.sidebar-brand {
		padding: 1.5rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.brand-text {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.sidebar-nav {
		flex: 1;
		padding: 0.75rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1.25rem;
		color: #b8bcc4;
		text-decoration: none;
		font-size: 0.9375rem;
		font-weight: 500;
		transition: background 0.15s, color 0.15s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e8eaed;
	}

	.nav-link.active {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.nav-icon {
		flex-shrink: 0;
		opacity: 0.9;
	}

	.sidebar-footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.back-link {
		color: #8b919a;
		font-size: 0.875rem;
	}

	.admin-main {
		flex: 1;
		min-width: 0;
		background: #f5f6f8;
		padding: 2rem;
		overflow: auto;
	}
</style>

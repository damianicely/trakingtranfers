<script lang="ts">
	import { page } from '$app/stores';
	import AdminIcon from '$lib/components/admin/AdminIcon.svelte';

	let { data } = $props();

	const menuItems = [
		{ href: '/admin', label: 'Overview', icon: 'dashboard' as const },
		{ href: '/admin/analytics', label: 'Analytics', icon: 'barChart' as const },
		{ href: '/admin/calendar', label: 'Schedule', icon: 'calendar' as const },
		{ href: '/admin/team', label: 'Team', icon: 'users' as const },
		{ href: '/admin/locations', label: 'Locations', icon: 'building' as const },
		{ href: '/admin/documents', label: 'Documents', icon: 'bookOpen' as const },
		{ href: '/admin/contacts', label: 'Contacts', icon: 'userCircle' as const },
		{ href: '/admin/reports', label: 'Reports', icon: 'fileText' as const },
		{ href: '/admin/activity', label: 'Activity', icon: 'inbox' as const },
		{ href: '/admin/settings', label: 'Settings', icon: 'settings' as const }
	];

	const currentPath = $derived($page.url.pathname);
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
					<span class="nav-label">{item.label}</span>
				</a>
			{/each}
		</nav>
		<div class="sidebar-footer">
			<a href="/dashboard" class="nav-link back-link">← Back to Dashboard</a>
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

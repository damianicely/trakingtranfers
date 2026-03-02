<script lang="ts">
	import { page } from '$app/stores';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { user } = $derived(data);

	const t = $derived(translations[$language]);
	const currentPath = $derived($page.url.pathname);
	let sidebarOpen = $state(false);

	// Get user initials
	const userInitials = $derived(() => {
		if (!user) return 'U';
		const name = user.username || 'User';
		const parts = name.split(/[\s._-]+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	});

	// Get user display name
	const userDisplayName = $derived(() => {
		if (!user) return 'User';
		// Capitalize username for display
		return user.username
			.split(/[._-]/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	});

	// Get user email
	const userEmail = $derived(() => {
		return user?.username || '';
	});

	const menuItems = $derived([
		{ href: '/admin', labelKey: 'admin_nav_overview', icon: 'dashboard' },
		{ href: '/admin/sales', labelKey: 'admin_nav_sales', icon: 'barChart' },
		{ href: '/admin/calendar', labelKey: 'admin_nav_schedule', icon: 'calendar' },
		{ href: '/admin/team', labelKey: 'admin_nav_team', icon: 'users' },
		{ href: '/admin/locations', labelKey: 'admin_nav_accommodation', icon: 'building' },
		{ href: '/admin/contacts', labelKey: 'admin_nav_customers', icon: 'userCircle' }
	]);

	function isActive(href: string): boolean {
		if (href === '/admin') {
			return currentPath === '/admin';
		}
		return currentPath.startsWith(href);
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}

	function setLanguage(lang: 'en' | 'pt') {
		$language = lang;
	}

	// Close sidebar on route change (mobile)
	$effect(() => {
		if (sidebarOpen) {
			sidebarOpen = false;
		}
	});

	// Close sidebar on escape key
	onMount(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && sidebarOpen) {
				sidebarOpen = false;
			}
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="/src/lib/styles/admin-layout.css" />
</svelte:head>

<div class="admin-app">
	<!-- Mobile Header -->
	<header class="mobile-header">
		<button class="mobile-menu-btn" onclick={toggleSidebar} aria-label="Toggle menu">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="3" y1="12" x2="21" y2="12"></line>
				<line x1="3" y1="6" x2="21" y2="6"></line>
				<line x1="3" y1="18" x2="21" y2="18"></line>
			</svg>
		</button>
		<a href="/admin" class="mobile-logo">
			<span>Traking</span>
			<span class="brand-dot"></span>
		</a>
		<div style="width: 40px;"></div>
	</header>

	<!-- Overlay -->
	<div class="overlay" class:active={sidebarOpen} onclick={closeSidebar}></div>

	<!-- Sidebar -->
	<aside class="admin-sidebar" class:open={sidebarOpen}>
		<div class="sidebar-brand">
			<a href="/admin" class="brand-text">Traking</a>
			<span class="brand-dot"></span>
		</div>

		<nav class="sidebar-nav">
			{#each menuItems as item}
				<a
					href={item.href}
					class="nav-link"
					class:active={isActive(item.href)}
					onclick={closeSidebar}
				>
					{#if item.icon === 'dashboard'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="3" width="7" height="7"></rect>
							<rect x="14" y="3" width="7" height="7"></rect>
							<rect x="14" y="14" width="7" height="7"></rect>
							<rect x="3" y="14" width="7" height="7"></rect>
						</svg>
					{:else if item.icon === 'barChart'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="12" y1="20" x2="12" y2="10"></line>
							<line x1="18" y1="20" x2="18" y2="4"></line>
							<line x1="6" y1="20" x2="6" y2="16"></line>
						</svg>
					{:else if item.icon === 'calendar'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="16" y1="2" x2="16" y2="6"></line>
							<line x1="8" y1="2" x2="8" y2="6"></line>
							<line x1="3" y1="10" x2="21" y2="10"></line>
						</svg>
					{:else if item.icon === 'users'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
							<circle cx="9" cy="7" r="4"></circle>
							<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path>
						</svg>
					{:else if item.icon === 'building'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
							<polyline points="9 22 9 12 15 12 15 22"></polyline>
						</svg>
					{:else if item.icon === 'userCircle'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
							<circle cx="12" cy="7" r="4"></circle>
						</svg>
					{/if}
					<span>{t[item.labelKey] ?? item.labelKey}</span>
				</a>
			{/each}

			<!-- Language Toggle -->
			<div class="nav-item">
				<div class="nav-link language-toggle-wrapper">
					<svg
						class="nav-icon"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="2" y1="12" x2="22" y2="12"></line>
						<path
							d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
						></path>
					</svg>
					<span class="language-toggle">
						<button class:active={$language === 'en'} onclick={() => setLanguage('en')}>EN</button>
						<span>|</span>
						<button class:active={$language === 'pt'} onclick={() => setLanguage('pt')}>PT</button>
					</span>
				</div>
			</div>
		</nav>

		<!-- User Card Footer -->
		<div class="sidebar-footer">
			<a href="/account" class="user-card">
				<div class="user-avatar">{userInitials()}</div>
				<div class="user-info">
					<div class="user-name">{userDisplayName()}</div>
					<div class="user-email">{userEmail()}</div>
				</div>
				<svg
					class="user-card-arrow"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</a>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="admin-main">
		<slot />
	</main>
</div>

<style>
	@import '/src/lib/styles/admin-layout.css';
</style>

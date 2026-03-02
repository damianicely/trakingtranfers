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
		return user.username
			.split(/[._-]/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	});

	// Customer menu items (3 items)
	const menuItems = $derived([
		{ href: '/dashboard', labelKey: 'dashboard_nav_bookings', icon: 'bookings' },
		{ href: '/dashboard/track', labelKey: 'dashboard_nav_track', icon: 'track' },
		{ href: '/dashboard/contact', labelKey: 'dashboard_nav_contact', icon: 'contact' }
	]);

	function isActive(href: string): boolean {
		if (href === '/dashboard') {
			return currentPath === '/dashboard' || currentPath === '/dashboard/';
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

<div class="customer-app">
	<!-- Mobile Header -->
	<header class="mobile-header">
		<button class="mobile-menu-btn" onclick={toggleSidebar} aria-label="Toggle menu">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="3" y1="12" x2="21" y2="12"></line>
				<line x1="3" y1="6" x2="21" y2="6"></line>
				<line x1="3" y1="18" x2="21" y2="18"></line>
			</svg>
		</button>
		<a href="/dashboard" class="mobile-logo">
			<span>Traking</span>
			<span class="brand-dot"></span>
		</a>
		<div style="width: 40px;"></div>
	</header>

	<!-- Overlay -->
	<div class="overlay" class:active={sidebarOpen} onclick={closeSidebar}></div>

	<!-- Sidebar -->
	<aside class="customer-sidebar" class:open={sidebarOpen}>
		<div class="sidebar-brand">
			<a href="/dashboard" class="brand-text">Traking</a>
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
					{#if item.icon === 'bookings'}
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
					{:else if item.icon === 'track'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
							<circle cx="12" cy="10" r="3"></circle>
						</svg>
					{:else if item.icon === 'contact'}
						<svg
							class="nav-icon"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
							></path>
							<polyline points="22,6 12,13 2,6"></polyline>
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
							d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
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
					<div class="user-email">{user?.username || ''}</div>
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
	<main class="customer-main">
		<slot />
	</main>
</div>

<style>
	@import '/src/lib/styles/admin-layout.css';

	.customer-app {
		display: flex;
		min-height: 100vh;
		font-family: var(--font-body, 'Inter', sans-serif);
		color: var(--color-text, #333333);
	}

	.customer-sidebar {
		width: 280px;
		flex-shrink: 0;
		background: #ffffff;
		border-right: 1px solid var(--color-border, #e0e0e0);
		display: flex;
		flex-direction: column;
		position: fixed;
		height: 100vh;
		z-index: 100;
		transition: transform 0.3s ease;
	}

	.sidebar-brand {
		padding: 2rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.brand-text {
		font-family: var(--font-heading, 'Playfair Display', serif);
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		text-decoration: none;
	}

	.brand-dot {
		width: 8px;
		height: 8px;
		background: var(--color-accent, #c4a77d);
		border-radius: 50%;
	}

	.sidebar-nav {
		flex: 1;
		padding: 0.5rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		overflow-y: auto;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 0.75rem;
		color: var(--color-text, #333333);
		text-decoration: none;
		font-size: 0.9375rem;
		font-weight: 500;
		border-radius: 8px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.nav-link:hover {
		background: var(--color-secondary, #f5f5f0);
		color: var(--color-primary, #1a1a1a);
	}

	.nav-link.active {
		background: var(--color-primary, #1a1a1a);
		color: #ffffff;
	}

	.nav-link.active .nav-icon {
		opacity: 1;
	}

	.nav-icon {
		width: 20px;
		height: 20px;
		opacity: 0.7;
		flex-shrink: 0;
	}

	.language-toggle-wrapper {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.language-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text, #333333);
	}

	.language-toggle button {
		background: none;
		border: none;
		font-family: inherit;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		opacity: 0.5;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.language-toggle button.active {
		opacity: 1;
		font-weight: 600;
	}

	.language-toggle button:hover {
		opacity: 0.8;
	}

	.sidebar-footer {
		margin-top: auto;
		padding: 1.5rem 1rem;
		border-top: 1px solid var(--color-border, #e0e0e0);
	}

	.user-card {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem;
		border-radius: 8px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		text-decoration: none;
	}

	.user-card:hover {
		background: var(--color-secondary, #f5f5f0);
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(
			135deg,
			var(--color-accent, #c4a77d) 0%,
			var(--color-accent-dark, #a08960) 100%
		);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		font-weight: 600;
		font-size: 0.9375rem;
		flex-shrink: 0;
	}

	.user-info {
		flex: 1;
		min-width: 0;
	}

	.user-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--color-primary, #1a1a1a);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-email {
		font-size: 0.8125rem;
		color: var(--color-text-light, #666666);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-card-arrow {
		width: 16px;
		height: 16px;
		color: var(--color-text-light, #666666);
		flex-shrink: 0;
	}

	.customer-main {
		flex: 1;
		margin-left: 280px;
		background: linear-gradient(135deg, #f8f8f5 0%, #f0f0eb 100%);
		min-height: 100vh;
		padding: 2rem 3rem;
		overflow: auto;
	}

	/* Mobile Header */
	.mobile-header {
		display: none;
		padding: 1rem;
		background: #ffffff;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		position: sticky;
		top: 0;
		z-index: 99;
		align-items: center;
		justify-content: space-between;
	}

	.mobile-menu-btn {
		display: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		color: var(--color-primary, #1a1a1a);
	}

	.mobile-menu-btn svg {
		width: 24px;
		height: 24px;
	}

	.mobile-logo {
		font-family: var(--font-heading, 'Playfair Display', serif);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* Overlay */
	.overlay {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 99;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.overlay.active {
		display: block;
		opacity: 1;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.mobile-header {
			display: flex;
		}

		.mobile-menu-btn {
			display: block;
		}

		.customer-sidebar {
			transform: translateX(-100%);
		}

		.customer-sidebar.open {
			transform: translateX(0);
		}

		.customer-main {
			margin-left: 0;
			padding: 1.5rem;
		}

		.overlay {
			display: block;
			pointer-events: none;
		}

		.overlay.active {
			pointer-events: auto;
		}
	}

	@media (max-width: 640px) {
		.customer-main {
			padding: 1rem;
		}
	}
</style>

<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	export type OwnerSectionKey =
		| 'overview'
		| 'calendar'
		| 'staff'
		| 'hotels'
		| 'bookings'
		| 'customers'
		| 'account';

	const SECTION_KEYS: OwnerSectionKey[] = [
		'overview',
		'calendar',
		'staff',
		'hotels',
		'bookings',
		'customers',
		'account'
	];

	function isValidSection(s: string): s is OwnerSectionKey {
		return SECTION_KEYS.includes(s as OwnerSectionKey);
	}

	let { data, form = {}, initialSection = 'overview' } = $props<{
		data: Record<string, unknown>;
		form?: { success?: boolean; message?: string };
		initialSection?: string;
	}>();

	const t = $derived(translations[$language]);

	const sectionLabels: Record<OwnerSectionKey, string> = $derived({
		overview: t.dashboard_section_owner_overview_title ?? 'Overview',
		calendar: 'Calendar',
		staff: t.staff_title ?? 'Staff',
		hotels: 'Hotels',
		bookings: 'Bookings',
		customers: 'Customers',
		account: t.dashboard_section_account_title ?? 'Account Info'
	});

	let selectedSection = $state<OwnerSectionKey>('overview');
	let sidebarOpen = $state(true);
	let loadedComponents = $state<Partial<Record<OwnerSectionKey, import('svelte').Component>>>(
		{} as Partial<Record<OwnerSectionKey, import('svelte').Component>>
	);
	let loading = $state(false);
	let prevInitialSection = $state(initialSection);

	$effect(() => {
		const next = initialSection;
		if (next !== prevInitialSection) {
			prevInitialSection = next;
			if (isValidSection(next)) selectedSection = next;
		}
	});

	const sectionLoaders: Record<OwnerSectionKey, () => Promise<{ default: import('svelte').Component }>> = {
		overview: () => import('./OwnerOverviewSection.svelte'),
		calendar: () => import('./OwnerCalendarSection.svelte'),
		staff: () => import('./OwnerStaffSection.svelte'),
		hotels: () => import('./OwnerHotelsSection.svelte'),
		bookings: () => import('./OwnerBookingsSection.svelte'),
		customers: () => import('./OwnerCustomersSection.svelte'),
		account: () => import('./OwnerAccountSection.svelte')
	};

	async function ensureSectionLoaded(key: OwnerSectionKey) {
		if (loadedComponents[key]) return;
		loading = true;
		try {
			const mod = await sectionLoaders[key]();
			loadedComponents[key] = mod.default;
		} finally {
			loading = false;
		}
	}

	function selectSection(key: OwnerSectionKey) {
		selectedSection = key;
		ensureSectionLoaded(key);
		sidebarOpen = false;
	}

	const ActiveComponent = $derived(loadedComponents[selectedSection]);
	const sectionData = $derived({ ...data, form });

	$effect(() => {
		ensureSectionLoaded(selectedSection);
	});
</script>

<div class="owner-shell">
	<button
		type="button"
		class="sidebar-toggle"
		aria-label="Toggle menu"
		onclick={() => (sidebarOpen = !sidebarOpen)}
	>
		<span class="hamburger" aria-hidden="true"></span>
	</button>

	<aside class="sidebar" class:open={sidebarOpen}>
		<nav class="sidebar-nav">
			{#each SECTION_KEYS as key}
				<button
					type="button"
					class="nav-item"
					class:active={selectedSection === key}
					onclick={() => selectSection(key)}
				>
					{sectionLabels[key]}
				</button>
			{/each}
		</nav>
		<div class="sidebar-footer">
			<form method="POST" action="/logout" class="logout-form">
				<button type="submit" class="nav-item nav-item-logout">{t.dashboard_logout}</button>
			</form>
		</div>
	</aside>

	{#if sidebarOpen}
		<div
			class="sidebar-backdrop"
			role="button"
			tabindex="-1"
			aria-label="Close menu"
			onclick={() => (sidebarOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
		></div>
	{/if}

	<main class="owner-main">
		{#if loading && !ActiveComponent}
			<div class="section-loading">Loading…</div>
		{:else if ActiveComponent}
			{@const Comp = ActiveComponent}
			<Comp data={sectionData} />
		{/if}
	</main>
</div>

<style>
	.owner-shell {
		display: flex;
		min-height: 100vh;
		position: relative;
		width: 100%;
		max-width: 100%;
		margin: 0;
		padding: 0;
	}

	.sidebar-toggle {
		display: none;
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 100;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--border, #e0e0e0);
		border-radius: 6px;
		background: var(--sidebar-bg, #f5f5f5);
		cursor: pointer;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.hamburger {
		display: block;
		width: 1.25rem;
		height: 2px;
		background: currentColor;
		box-shadow: 0 -5px 0 currentColor, 0 5px 0 currentColor;
	}

	.sidebar {
		width: 220px;
		flex-shrink: 0;
		min-height: 100%;
		background: var(--sidebar-bg, #f5f5f5);
		border-right: 1px solid var(--border, #e0e0e0);
		display: flex;
		flex-direction: column;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem 0.75rem;
		flex: 1;
	}

	.sidebar-footer {
		padding: 0.75rem;
		border-top: 1px solid var(--border, #e0e0e0);
	}

	.sidebar-footer .logout-form {
		margin: 0;
	}

	.nav-item-logout {
		width: 100%;
		background: #dc3545;
		color: white;
	}

	.nav-item-logout:hover {
		background: #c82333;
		color: white;
	}

	.nav-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 0.6rem 0.75rem;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: var(--text-muted, #555);
		font-size: 0.95rem;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.nav-item:hover {
		background: rgba(0, 0, 0, 0.06);
		color: var(--text, #1a1a1a);
	}

	.nav-item.active {
		background: var(--accent-bg, #e8f0fe);
		color: var(--accent, #1a73e8);
		font-weight: 500;
	}

	.sidebar-backdrop {
		display: none;
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 40;
	}

	.owner-main {
		flex: 1;
		min-width: 0;
		padding: 1.5rem;
		background: var(--page-bg, #fff);
	}

	.section-loading {
		padding: 2rem;
		text-align: center;
		color: var(--text-muted, #666);
	}

	@media (max-width: 768px) {
		.sidebar-toggle {
			display: flex;
		}

		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			z-index: 50;
			transform: translateX(-100%);
			box-shadow: none;
		}

		.sidebar.open {
			transform: translateX(0);
			box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
		}

		.sidebar-backdrop {
			display: block;
		}

		.owner-main {
			padding-top: 3.5rem;
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>

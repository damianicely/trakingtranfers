<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import AccountInfo from './AccountInfo.svelte';

	let { user } = $props<{
		user: { username: string; id: string; role: string };
	}>();

	const t = $derived(translations[$language]);
</script>

<section class="dashboard-section">
	<h2>{t.dashboard_section_owner_overview_title}</h2>
	<p>{t.dashboard_section_owner_overview_description}</p>
	<div class="placeholder">
		<p>{t.dashboard_section_owner_overview_placeholder}</p>
	</div>
</section>

<section class="dashboard-section">
	<h2>{t.dashboard_section_owner_bookings_title}</h2>
	<p>{t.dashboard_section_owner_bookings_description}</p>
	<div class="placeholder">
		<p>{t.dashboard_section_owner_bookings_placeholder}</p>
	</div>
</section>

<AccountInfo {user} roleLabel={t.dashboard_role_owner} />

<style>
	.dashboard-section {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.dashboard-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.dashboard-section > p {
		margin: 0 0 1rem 0;
		color: #666;
		font-size: 0.9rem;
	}

	.placeholder {
		padding: 2rem;
		text-align: center;
		background: white;
		border-radius: 4px;
		color: #999;
	}
</style>

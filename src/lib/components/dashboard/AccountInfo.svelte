<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	let { user, roleLabel } = $props<{
		user: { username: string; id: string };
		roleLabel: string;
	}>();

	const t = $derived(translations[$language]);
</script>

<section class="dashboard-section">
	<h2>{t.dashboard_section_account_title}</h2>
	<dl class="info-list">
		<dt>{t.dashboard_label_username}</dt>
		<dd>{user.username}</dd>
		<dt>{t.dashboard_label_user_id}</dt>
		<dd>{user.id}</dd>
		<dt>{t.dashboard_label_role}</dt>
		<dd>{roleLabel}</dd>
	</dl>
</section>

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

	.info-list {
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
	}

	.info-list dt {
		font-weight: 600;
		color: #666;
	}

	.info-list dd {
		margin: 0;
		color: #1a1a1a;
	}
</style>

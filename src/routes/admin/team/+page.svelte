<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import StaffSection from '$lib/components/dashboard/admin/StaffSection.svelte';

	let { data, form } = $props();

	const t = $derived(translations[$language]);
</script>

<div class="admin-team">
	<header class="page-header">
		<h1 class="page-title">{t.team_title ?? 'Team'}</h1>
		<p class="page-subtitle">Manage team members (admins and drivers).</p>
	</header>

	<section class="content-section">
		<div class="table-wrapper team-section-wrapper">
			<StaffSection allStaff={data.allStaff ?? []} form={form} useTeamLabels={true} />
		</div>
	</section>
</div>

<style>
	.admin-team {
		max-width: 960px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 600;
		color: #1a1d21;
		letter-spacing: -0.02em;
		margin: 0 0 0.25rem 0;
	}

	.page-subtitle {
		font-size: 0.9375rem;
		color: #5f6368;
		margin: 0;
		font-weight: 500;
	}

	.content-section {
		margin-bottom: 2rem;
	}

	.table-wrapper {
		background: #fff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.team-section-wrapper {
		padding: 1.5rem;
	}

	/* Match admin sleek styling inside StaffSection */
	.team-section-wrapper :global(.staff-section) {
		width: 100%;
	}

	.team-section-wrapper :global(.table-header h3) {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1d21;
		margin: 0;
	}

	.team-section-wrapper :global(.btn-add) {
		padding: 0.5rem 1rem;
		background: #1a1d21;
		color: #fff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9375rem;
	}

	.team-section-wrapper :global(.btn-add:hover) {
		background: #2d3238;
	}

	.team-section-wrapper :global(.add-form) {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.team-section-wrapper :global(.add-form h4) {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1d21;
		margin: 0 0 1rem 0;
	}

	.team-section-wrapper :global(.data-table th) {
		background: #f8f9fa;
		font-weight: 600;
		color: #1a1d21;
		padding: 0.875rem 1.25rem;
		border-bottom: 1px solid #eef0f2;
		font-size: 0.875rem;
	}

	.team-section-wrapper :global(.data-table td) {
		padding: 0.875rem 1.25rem;
		border-bottom: 1px solid #f0f1f3;
		color: #3c4043;
		font-size: 0.875rem;
	}

	.team-section-wrapper :global(.data-table tbody tr:hover td) {
		background: #fafbfc;
	}

	.team-section-wrapper :global(.empty-state) {
		color: #5f6368;
		font-style: italic;
		padding: 2rem;
		text-align: center;
	}

	.team-section-wrapper :global(.success-message) {
		background: #e6f4ea;
		color: #137333;
		border-radius: 6px;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		font-size: 0.9375rem;
	}

	.team-section-wrapper :global(.error-message) {
		background: #fce8e6;
		color: #c5221f;
		border-radius: 6px;
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		font-size: 0.9375rem;
	}

	.team-section-wrapper :global(.btn-submit) {
		background: #1a1d21;
		color: #fff;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		font-weight: 500;
	}

	.team-section-wrapper :global(.btn-delete) {
		background: #c5221f;
		color: #fff;
		border-radius: 6px;
	}

	.team-section-wrapper :global(.btn-delete:hover) {
		background: #a31816;
	}
</style>

<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import CompactCalendar from '$lib/components/dashboard/admin/CompactCalendar.svelte';
	import AdminTransfersForDay from '$lib/components/dashboard/admin/AdminTransfersForDay.svelte';

	let { data } = $props();
	const t = $derived(translations[$language]);
</script>

<div class="admin-calendar">
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.admin_nav_schedule}</h1>
	</div>

	<!-- Calendar Section -->
	<section class="content-section">
		<div class="data-table-container">
			<CompactCalendar
				calendarMonth={data.calendarMonth}
				selectedDate={data.selectedDate}
				highlightedDates={data.highlightedDates}
				basePath="/admin/calendar"
				hint={t.calendar_hint}
			/>
		</div>
	</section>

	<!-- Transfers Section -->
	<section class="content-section">
		<div class="data-table-container">
			<AdminTransfersForDay
				selectedDate={data.selectedDate}
				legSummaries={data.legSummaries ?? []}
				drivers={data.drivers ?? []}
				driverAssignments={data.driverAssignments ?? {}}
				bookingDetailsById={data.bookingDetailsById ?? {}}
			/>
		</div>
	</section>
</div>

<style>
	.admin-calendar {
		width: 100%;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-family: var(--font-heading, 'Playfair Display', serif);
		font-size: 2rem;
		font-weight: 500;
		color: var(--color-primary, #1a1a1a);
		margin: 0;
	}

	.content-section {
		margin-bottom: 2rem;
	}

	.data-table-container {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}
</style>

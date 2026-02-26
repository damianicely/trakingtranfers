<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import CompactCalendar from '$lib/components/dashboard/admin/CompactCalendar.svelte';
	import AdminTransfersForDay from '$lib/components/dashboard/admin/AdminTransfersForDay.svelte';

	let { data } = $props();
	const t = $derived(translations[$language]);
</script>

<div class="admin-calendar">
	<section class="content-section">
		<div class="table-wrapper">
			<div class="table-inner">
				<CompactCalendar
					calendarMonth={data.calendarMonth}
					selectedDate={data.selectedDate}
					highlightedDates={data.highlightedDates}
					basePath="/admin/calendar"
					hint={t.calendar_hint}
				/>
			</div>
		</div>
	</section>

	<section class="content-section">
		<div class="table-wrapper">
			<div class="table-inner">
				<AdminTransfersForDay
					selectedDate={data.selectedDate}
					legSummaries={data.legSummaries ?? []}
					drivers={data.drivers ?? []}
					driverAssignments={data.driverAssignments ?? {}}
					bookingDetailsById={data.bookingDetailsById ?? {}}
				/>
			</div>
		</div>
	</section>
</div>

<style>
	.admin-calendar {
		max-width: 960px;
		margin: 0 auto;
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

	.table-inner {
		padding: 1.5rem;
	}
</style>



<script lang="ts">
	import CompactCalendar from '$lib/components/dashboard/admin/CompactCalendar.svelte';

	let { data } = $props<{
		data: {
			calendarSummary?: Array<{
				date: string;
				hasActiveJourneys: boolean;
				hasDriverAssignments: boolean;
			}>;
			calendarMonth?: string;
			selectedDate?: string;
		};
	}>();

	type CalendarSummaryItem = {
		date: string;
		hasActiveJourneys: boolean;
		hasDriverAssignments: boolean;
	};

	const highlightedDates = $derived(
		new Set(
			((data.calendarSummary ?? []) as CalendarSummaryItem[])
				.filter((d) => d.hasActiveJourneys)
				.map((d) => d.date)
		)
	);
</script>

<div class="owner-calendar-section">
	<CompactCalendar
		calendarMonth={data.calendarMonth ?? ''}
		selectedDate={data.selectedDate ?? ''}
		highlightedDates={highlightedDates}
		basePath="/dashboard"
		hint="Days with journeys are highlighted. Click a day to see details."
	/>
</div>

<style>
	.owner-calendar-section {
		width: 100%;
		max-width: 100%;
	}
</style>

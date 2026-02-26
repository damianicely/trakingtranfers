<script lang="ts">
	import AdminSchedule from '$lib/components/dashboard/admin/AdminSchedule.svelte';

	let { data } = $props<{
		data: {
			calendarSummary?: Array<{ date: string; hasActiveJourneys: boolean; hasDriverAssignments: boolean }>;
			stepAssignments?: Record<string, string>;
			bookedStepsForDate?: Array<[string, string]>;
			allDrivers?: Array<{ id: string; username: string }>;
			calendarMonth?: string;
			selectedDate?: string;
			form?: { success?: boolean; message?: string };
		};
	}>();
</script>

<div class="owner-calendar-section">
	<AdminSchedule
		calendarSummary={data.calendarSummary ?? []}
		stepAssignments={data.stepAssignments ?? {}}
		bookedStepsForDate={data.bookedStepsForDate ?? []}
		allDrivers={data.allDrivers ?? []}
		calendarMonth={data.calendarMonth ?? ''}
		selectedDate={data.selectedDate ?? ''}
		form={data.form}
	/>
</div>

<style>
	.owner-calendar-section {
		width: 100%;
		max-width: 100%;
	}
</style>

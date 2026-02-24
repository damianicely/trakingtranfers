<script lang="ts">
	import { getStepLabel } from '$lib/delivery-steps';
	import { invalidateAll } from '$app/navigation';

	let {
		calendarSummary,
		stepAssignments,
		bookedStepsForDate,
		allDrivers,
		calendarMonth,
		selectedDate,
		form
	} = $props<{
		calendarSummary: Array<{ date: string; hasActiveJourneys: boolean; hasDriverAssignments: boolean }>;
		stepAssignments: Record<string, string>;
		bookedStepsForDate: Array<[string, string]>;
		allDrivers: Array<{ id: string; username: string }>;
		calendarMonth: string;
		selectedDate: string;
		form?: { success?: boolean; message?: string };
	}>();

	const [year, month] = $derived(calendarMonth.split('-').map(Number));
	const monthTitle = $derived(
		year && month
			? new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
			: ''
	);
	const firstDay = $derived(year && month ? new Date(year, month - 1, 1) : new Date(0));
	const lastDay = $derived(year && month ? new Date(year, month, 0).getDate() : 0);
	const startWeekday = $derived(firstDay.getDay());
	const summaryByDate = $derived(
		Object.fromEntries(
			calendarSummary.map((d: { date: string; hasActiveJourneys: boolean; hasDriverAssignments: boolean }) => [d.date, d])
		)
	);

	// Local selection per leg so row highlight updates when user ticks before submitting
	let selectedByLeg = $state<Record<string, string>>({});
	$effect(() => {
		const next: Record<string, string> = {};
		for (const [fromId, toId] of bookedStepsForDate) {
			const key = stepKey(fromId, toId);
			next[key] = stepAssignments[key] ?? '';
		}
		selectedByLeg = next;
	});

	const prevMonth = $derived(
		year && month
			? (() => {
					const d = new Date(year, month - 2, 1);
					return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
				})()
			: ''
	);
	const nextMonth = $derived(
		year && month
			? (() => {
					const d = new Date(year, month, 1);
					return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
				})()
			: ''
	);

	function dayClass(dateStr: string): string {
		const s = summaryByDate[dateStr];
		if (!s) return 'day-cell';
		if (!s.hasActiveJourneys) return 'day-cell day-none';
		if (!s.hasDriverAssignments) return 'day-cell day-no-drivers';
		return 'day-cell day-with-drivers';
	}

	function buildDayUrl(dateStr: string): string {
		return `/dashboard?calendarMonth=${calendarMonth}&selectedDate=${dateStr}`;
	}

	function stepKey(fromId: string, toId: string): string {
		return `${fromId}-${toId}`;
	}

	async function saveStepAssignment(fromId: string, toId: string, driverId: string) {
		const fd = new FormData();
		fd.set('date', selectedDate);
		fd.set('fromStageId', fromId);
		fd.set('toStageId', toId);
		fd.set('driverId', driverId);
		fd.set('calendarMonth', calendarMonth);
		const res = await fetch('/dashboard?/assignDriverToStep', {
			method: 'POST',
			body: fd,
			credentials: 'include',
			redirect: 'manual'
		});
		if (res.type === 'opaqueredirect' || res.status === 303 || res.ok) {
			await invalidateAll();
		}
	}

	function handleLegCheck(e: Event, key: string, fromId: string, toId: string) {
		const row = (e.target as HTMLInputElement).closest('tr');
		if (!row) return;
		const checkboxes = row.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
		const target = e.target as HTMLInputElement;
		const newVal = target.checked ? target.value : '';
		selectedByLeg = { ...selectedByLeg, [key]: newVal };
		if (target.checked) {
			checkboxes.forEach((cb) => {
				if (cb !== target) cb.checked = false;
			});
		}
		saveStepAssignment(fromId, toId, newVal);
	}
</script>

<div class="admin-schedule">
	{#if form?.message}
		<p class="form-message" class:success={form.success} class:error={!form.success}>
			{form.message}
		</p>
	{/if}

	{#if monthTitle}
		<div class="calendar-header">
			<a class="nav-link" href="/dashboard?calendarMonth={prevMonth}&selectedDate={selectedDate}">
				← Previous
			</a>
			<h3 class="month-title">{monthTitle}</h3>
			<a class="nav-link" href="/dashboard?calendarMonth={nextMonth}&selectedDate={selectedDate}">
				Next →
			</a>
		</div>
		<div class="calendar-grid">
			<div class="weekday-headers">
				<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
			</div>
			<div class="days-grid">
				{#each Array(startWeekday) as _}
					<div class="day-cell day-empty"></div>
				{/each}
				{#each Array(lastDay) as _, i}
					{@const day = i + 1}
					{@const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
					<a class={dayClass(dateStr)} href={buildDayUrl(dateStr)}>
						{day}
					</a>
				{/each}
			</div>
		</div>
		<div class="legend">
			<span class="legend-item"><span class="dot day-none"></span> No journeys</span>
			<span class="legend-item"><span class="dot day-no-drivers"></span> Journeys, not all legs assigned</span>
			<span class="legend-item"><span class="dot day-with-drivers"></span> Journeys, all legs assigned</span>
		</div>
		<p class="calendar-hint">Click a day to assign drivers to booked legs.</p>
	{/if}

	{#if selectedDate && bookedStepsForDate.length > 0}
		<section class="day-detail">
			<h3>Assign drivers for {selectedDate}</h3>
			<p class="save-hint">Changes save as you tick or untick.</p>
			<table class="matrix-table">
				<thead>
					<tr>
						<th>Leg</th>
						{#each allDrivers as driver}
							<th>{driver.username}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each bookedStepsForDate as step}
						{@const [fromId, toId] = step}
						{@const key = stepKey(fromId, toId)}
						{@const assignedDriverId = selectedByLeg[key] ?? ''}
						<tr class:row-unassigned={!assignedDriverId} data-leg-key={key}>
							<td class="step-label">{getStepLabel(fromId, toId)}</td>
							{#each allDrivers as driver}
								<td class="checkbox-cell">
									<input
										type="checkbox"
										value={driver.id}
										checked={assignedDriverId === driver.id}
										onchange={(e) => handleLegCheck(e, key, fromId, toId)}
									/>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{:else if selectedDate}
		<section class="day-detail">
			<h3>Assign drivers for {selectedDate}</h3>
			<p class="no-legs">No booked legs on this date.</p>
		</section>
	{/if}
</div>

<style>
	.admin-schedule {
		width: 100%;
	}
	.form-message {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	.form-message.success {
		background: #d4edda;
		color: #155724;
	}
	.form-message.error {
		background: #f8d7da;
		color: #721c24;
	}
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		gap: 1rem;
	}
	.month-title {
		margin: 0;
		font-size: 1.25rem;
	}
	.nav-link {
		color: #0d6efd;
		text-decoration: none;
	}
	.nav-link:hover {
		text-decoration: underline;
	}
	.weekday-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		padding: 2px;
		font-size: 0.75rem;
		color: #666;
	}
	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		padding: 2px;
	}
	.day-cell {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		font-size: 0.9rem;
		text-decoration: none;
		color: inherit;
		background: #f0f0f0;
		color: #666;
	}
	.day-empty {
		background: transparent;
		cursor: default;
	}
	.day-none {
		background: #f0f0f0;
		color: #666;
	}
	.day-no-drivers {
		background: #fff3cd;
		color: #856404;
	}
	.day-with-drivers {
		background: #d4edda;
		color: #155724;
	}
	.day-cell:not(.day-empty):hover {
		opacity: 0.9;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1rem;
		font-size: 0.85rem;
		color: #666;
	}
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.dot {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}
	.calendar-hint {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: #666;
	}
	.day-detail {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e0e0e0;
	}
	.day-detail h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
	}
	.no-legs {
		color: #666;
		font-size: 0.9rem;
	}
	.save-hint {
		color: #666;
		font-size: 0.85rem;
		margin: 0 0 0.75rem 0;
	}
	.matrix-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	.matrix-table th,
	.matrix-table td {
		padding: 0.5rem 0.75rem;
		text-align: center;
		border: 1px solid #eee;
	}
	.matrix-table th {
		background: #f8f9fa;
		font-weight: 600;
	}
	.matrix-table .step-label {
		text-align: left;
	}
	.matrix-table tr.row-unassigned {
		background: #fff3cd;
	}
	.matrix-table tr.row-unassigned:hover {
		background: #ffe69c;
	}
	.matrix-table .checkbox-cell {
		min-width: 2rem;
		text-align: center;
	}
</style>

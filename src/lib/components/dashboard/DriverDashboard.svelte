<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { getStepLabel } from '$lib/delivery-steps';
	import AccountInfo from './AccountInfo.svelte';

	let { user, data } = $props<{
		user: { username: string; id: string; role: string };
		data: {
			driverAssignments?: Array<{ date: string; fromStageId: string; toStageId: string }>;
			calendarMonth?: string;
			selectedDate?: string;
		};
	}>();

	const t = $derived(translations[$language]);

	const calendarMonth = $derived(data.calendarMonth ?? '');
	const selectedDate = $derived(data.selectedDate ?? '');
	const driverAssignments = $derived(data.driverAssignments ?? []);

	const [year, month] = $derived(calendarMonth.split('-').map(Number));
	const monthTitle = $derived(
		year && month
			? new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
			: ''
	);
	const firstDay = $derived(year && month ? new Date(year, month - 1, 1) : new Date(0));
	const lastDay = $derived(year && month ? new Date(year, month, 0).getDate() : 0);
	const startWeekday = $derived(firstDay.getDay());

	const datesWithAssignments = $derived(new Set(driverAssignments.map((a) => a.date)));

	const assignmentsForSelectedDay = $derived(
		selectedDate ? driverAssignments.filter((a) => a.date === selectedDate) : []
	);

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

	function buildDayUrl(dateStr: string): string {
		return `/dashboard?calendarMonth=${calendarMonth}&selectedDate=${dateStr}`;
	}
</script>

<section class="dashboard-section">
	<h2>{t.dashboard_section_driver_today_title}</h2>
	<p>{t.dashboard_section_driver_today_description}</p>
	{#if assignmentsForSelectedDay.length > 0}
		<ul class="steps-list">
			{#each assignmentsForSelectedDay as a}
				<li>{getStepLabel(a.fromStageId, a.toStageId)}</li>
			{/each}
		</ul>
	{:else}
		<div class="placeholder">
			<p>{t.dashboard_section_driver_today_placeholder}</p>
		</div>
	{/if}
</section>

<section class="dashboard-section">
	<h2>{t.dashboard_section_driver_upcoming_title}</h2>
	<p>{t.dashboard_section_driver_upcoming_description}</p>

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
					<a
						class="day-cell"
						class:day-assigned={datesWithAssignments.has(dateStr)}
						class:day-selected={dateStr === selectedDate}
						href={buildDayUrl(dateStr)}
					>
						{day}
					</a>
				{/each}
			</div>
		</div>
		<p class="calendar-hint">Days when you have assignments are highlighted. Click a day to see your steps.</p>
	{:else}
		<div class="placeholder">
			<p>{t.dashboard_section_driver_upcoming_placeholder}</p>
		</div>
	{/if}
</section>

<AccountInfo {user} roleLabel={t.dashboard_role_driver} />

<style>
	.dashboard-section {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
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

	.steps-list {
		margin: 0;
		padding-left: 1.5rem;
		background: white;
		padding: 1rem 1.5rem;
		border-radius: 4px;
	}

	.steps-list li {
		margin: 0.25rem 0;
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

	.day-assigned {
		background: #cce5ff;
		color: #004085;
	}

	.day-selected {
		background: #0d6efd;
		color: white;
	}

	.day-cell:not(.day-empty):hover {
		opacity: 0.9;
	}

	.calendar-hint {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: #666;
	}
</style>

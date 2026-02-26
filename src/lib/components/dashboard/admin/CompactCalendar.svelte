<script lang="ts">
	let {
		calendarMonth,
		selectedDate,
		highlightedDates,
		basePath,
		hint
	} = $props<{
		calendarMonth: string;
		selectedDate: string;
		highlightedDates?: Array<string> | Set<string>;
		basePath?: string;
		hint?: string;
	}>();

	const [year, month] = $derived(calendarMonth.split('-').map(Number));
	const monthTitle = $derived(
		year && month
			? new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
					month: 'long',
					year: 'numeric'
				})
			: ''
	);
	const firstDay = $derived(year && month ? new Date(year, month - 1, 1) : new Date(0));
	const lastDay = $derived(year && month ? new Date(year, month, 0).getDate() : 0);
	const startWeekday = $derived(firstDay.getDay());

	const effectiveBasePath = $derived(basePath ?? '/dashboard');

	const highlightedSet = $derived(
		(() => {
			if (!highlightedDates) return new Set<string>();
			if (highlightedDates instanceof Set) {
				return highlightedDates as Set<string>;
			}
			return new Set(highlightedDates);
		})()
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
		return `${effectiveBasePath}?calendarMonth=${calendarMonth}&selectedDate=${dateStr}`;
	}
</script>

<div class="compact-calendar">
	{#if monthTitle}
		<div class="calendar-header">
			<a class="nav-link" href={`${effectiveBasePath}?calendarMonth=${prevMonth}&selectedDate=${selectedDate}`}>
				← Previous
			</a>
			<h3 class="month-title">{monthTitle}</h3>
			<a class="nav-link" href={`${effectiveBasePath}?calendarMonth=${nextMonth}&selectedDate=${selectedDate}`}>
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
						class:day-highlighted={highlightedSet.has(dateStr)}
						class:day-selected={dateStr === selectedDate}
						href={buildDayUrl(dateStr)}
					>
						{day}
					</a>
				{/each}
			</div>
		</div>
		{#if hint}
			<p class="calendar-hint">{hint}</p>
		{/if}
	{:else}
		<p class="calendar-empty">No calendar data available.</p>
	{/if}
</div>

<style>
	.compact-calendar {
		width: 100%;
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.month-title {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.nav-link {
		font-size: 0.85rem;
		color: #1a73e8;
		text-decoration: none;
	}

	.nav-link:hover {
		text-decoration: underline;
	}

	.calendar-grid {
		background: #ffffff;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		padding: 0.75rem 0.75rem 0.5rem;
	}

	.weekday-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		font-size: 0.75rem;
		color: #666;
		margin-bottom: 0.5rem;
	}

	.weekday-headers span {
		text-align: center;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
	}

	.day-cell {
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		border-radius: 999px;
		text-decoration: none;
		color: #1a1a1a;
	}

	.day-empty {
		background: transparent;
	}

	.day-highlighted {
		background: #e0f2fe;
		color: #075985;
		font-weight: 600;
	}

	.day-selected {
		background: #111827;
		color: #f9fafb;
		font-weight: 600;
	}

	.day-cell:hover {
		background: #f3f4f6;
	}

	.calendar-hint {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		color: #666;
	}

	.calendar-empty {
		font-size: 0.9rem;
		color: #666;
	}
</style>


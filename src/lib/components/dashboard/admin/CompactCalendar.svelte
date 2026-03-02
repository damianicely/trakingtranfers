<script lang="ts">
	let { calendarMonth, selectedDate, highlightedDates, basePath, hint } = $props<{
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
			<a
				class="nav-link"
				href={`${effectiveBasePath}?calendarMonth=${prevMonth}&selectedDate=${selectedDate}`}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
				Previous
			</a>
			<h3 class="month-title">{monthTitle}</h3>
			<a
				class="nav-link"
				href={`${effectiveBasePath}?calendarMonth=${nextMonth}&selectedDate=${selectedDate}`}
			>
				Next
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</a>
		</div>
		<div class="calendar-grid">
			<div class="weekday-headers">
				<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span
					>Fri</span
				><span>Sat</span>
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
		padding: 1.5rem;
	}

	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.month-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		font-family: var(--font-heading, 'Playfair Display', serif);
	}

	.nav-link {
		font-size: 0.9rem;
		color: var(--color-text, #333333);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.nav-link:hover {
		background: var(--color-secondary, #f5f5f0);
		color: var(--color-primary, #1a1a1a);
	}

	.calendar-grid {
		background: var(--color-secondary, #f5f5f0);
		border-radius: 12px;
		padding: 1rem;
	}

	.weekday-headers {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		font-size: 0.75rem;
		color: var(--color-text-light, #666666);
		margin-bottom: 0.5rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.weekday-headers span {
		text-align: center;
		padding: 0.5rem 0;
	}

	.days-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.25rem;
	}

	.day-cell {
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		border-radius: 8px;
		text-decoration: none;
		color: var(--color-text, #333333);
		background: white;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.day-empty {
		background: transparent;
	}

	.day-cell:hover:not(.day-empty) {
		background: var(--color-accent, #c4a77d);
		color: white;
	}

	.day-highlighted {
		background: rgba(196, 167, 125, 0.15);
		color: var(--color-accent-dark, #a08960);
		font-weight: 600;
	}

	.day-highlighted:hover {
		background: var(--color-accent, #c4a77d);
		color: white;
	}

	.day-selected {
		background: var(--color-primary, #1a1a1a);
		color: #f9fafb;
		font-weight: 600;
	}

	.day-selected:hover {
		background: var(--color-primary, #1a1a1a);
		color: #f9fafb;
	}

	.calendar-hint {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-light, #666666);
		font-style: italic;
	}

	.calendar-empty {
		font-size: 0.9rem;
		color: var(--color-text-light, #666666);
		text-align: center;
		padding: 2rem;
	}
</style>

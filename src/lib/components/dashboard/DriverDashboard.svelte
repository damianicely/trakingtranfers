<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import { getStepLabel } from '$lib/delivery-steps';

	let { user, data } = $props<{
		user: { username: string; id: string; role: string };
		data: {
			driverAssignments?: Array<{
				date: string;
				fromStageId: string;
				toStageId: string;
				pickups?: Array<{ hotelName: string; bags: number }>;
				totalBags?: number;
				bags?: Array<{
					bagId: string;
					label: string;
					bookingShortRef: string;
					legStatus: 'at_hotel' | 'with_driver' | 'delivered';
				}>;
			}>;
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

	// Calculate stats
	const totalRoutes = $derived(assignmentsForSelectedDay.length);
	const totalBags = $derived(
		assignmentsForSelectedDay.reduce((sum, a) => sum + (a.totalBags || 0), 0)
	);
	const completedDeliveries = $derived(
		assignmentsForSelectedDay.reduce((sum, a) => {
			if (!a.bags) return sum;
			return sum + a.bags.filter((b) => b.legStatus === 'delivered').length;
		}, 0)
	);

	// Track expanded routes
	let expandedRoutes = $state<Record<string, boolean>>({});

	const toggleRouteExpand = (routeKey: string) => {
		expandedRoutes = { ...expandedRoutes, [routeKey]: !expandedRoutes[routeKey] };
	};

	// Get status for a pickup location
	const getPickupStatus = (
		pickup: { hotelName: string; bags: number },
		routeBags?: Array<{ bagId: string; label: string; bookingShortRef: string; legStatus: string }>
	): string => {
		if (!routeBags || routeBags.length === 0) return t.driver_status_pending;

		// Check if any bags for this hotel are delivered
		const hotelBags = routeBags.filter((b) => b.legStatus === 'delivered');
		if (hotelBags.length === pickup.bags) return t.driver_status_delivered;

		// Check if any are picked up
		const pickedUpBags = routeBags.filter(
			(b) => b.legStatus === 'with_driver' || b.legStatus === 'delivered'
		);
		if (pickedUpBags.length > 0) return t.driver_status_picked_up;

		return t.driver_status_pending;
	};

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

	const formatSelectedDate = (dateStr: string): string => {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
	};
</script>

<div class="driver-dashboard">
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.dashboard_title_driver}</h1>
	</div>

	<!-- Stats Grid -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon icon-primary">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path
						d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
					></path>
					<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
					<line x1="12" y1="22.08" x2="12" y2="12"></line>
				</svg>
			</div>
			<div class="stat-content">
				<div class="stat-label">{t.driver_stat_routes_today}</div>
				<div class="stat-value">{totalRoutes}</div>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon icon-accent">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<path d="M16 10a4 4 0 0 1-8 0"></path>
				</svg>
			</div>
			<div class="stat-content">
				<div class="stat-label">{t.driver_stat_bags_to_deliver}</div>
				<div class="stat-value">{totalBags}</div>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon icon-success">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
			</div>
			<div class="stat-content">
				<div class="stat-label">{t.driver_stat_completed}</div>
				<div class="stat-value">{completedDeliveries}</div>
			</div>
		</div>
	</div>

	<!-- Today's Routes Section -->
	<section class="content-section">
		<div class="data-table-container">
			<div class="section-header">
				<div>
					<h2 class="section-title">{t.dashboard_section_driver_today_title}</h2>
					{#if selectedDate}
						<p class="section-desc">{formatSelectedDate(selectedDate)}</p>
					{:else}
						<p class="section-desc">{t.dashboard_section_driver_today_description}</p>
					{/if}
				</div>
			</div>

			{#if assignmentsForSelectedDay.length === 0}
				<div class="empty-state">
					<svg
						width="64"
						height="64"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
						<line x1="9" y1="9" x2="9.01" y2="9"></line>
						<line x1="15" y1="9" x2="15.01" y2="9"></line>
					</svg>
					<p>{t.driver_no_work}</p>
				</div>
			{:else}
				<div class="routes-list">
					{#each assignmentsForSelectedDay as assignment, index}
						{@const routeKey = `${assignment.date}-${index}`}
						{@const isExpanded = expandedRoutes[routeKey] || false}
						<div class="route-card" class:expanded={isExpanded}>
							<div class="route-header" onclick={() => toggleRouteExpand(routeKey)}>
								<div class="route-info">
									<div class="route-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path
												d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
											></path>
											<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
											<line x1="12" y1="22.08" x2="12" y2="12"></line>
										</svg>
									</div>
									<div class="route-main">
										<h3>
											{t.driver_route}: {getStepLabel(assignment.fromStageId, assignment.toStageId)}
										</h3>
										<p class="route-meta">
											{#if assignment.totalBags}
												{assignment.totalBags} {assignment.totalBags === 1 ? 'bag' : 'bags'} total
											{/if}
										</p>
									</div>
								</div>
								<div class="route-actions">
									{#if isExpanded}
										<span class="expand-text">
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<polyline points="18 15 12 9 6 15"></polyline>
											</svg>
											{t.driver_hide_details}
										</span>
									{:else}
										<span class="expand-text">
											<svg
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<polyline points="6 9 12 15 18 9"></polyline>
											</svg>
											{t.driver_view_details}
										</span>
									{/if}
								</div>
							</div>

							{#if isExpanded && assignment.pickups && assignment.pickups.length > 0}
								<div class="route-details">
									<table class="pickup-table">
										<thead>
											<tr>
												<th>{t.driver_pickup_location}</th>
												<th>{t.driver_bags_count}</th>
												<th>{t.driver_status}</th>
											</tr>
										</thead>
										<tbody>
											{#each assignment.pickups as pickup}
												<tr>
													<td class="hotel-name">{pickup.hotelName}</td>
													<td class="bags-count">{pickup.bags}</td>
													<td class="status-cell">
														{#if assignment.bags}
															{@const pickupStatus = getPickupStatus(pickup, assignment.bags)}
															<span
																class="status-badge"
																class:status-pending={pickupStatus === t.driver_status_pending}
																class:status-picked={pickupStatus === t.driver_status_picked_up}
																class:status-delivered={pickupStatus === t.driver_status_delivered}
															>
																{#if pickupStatus === t.driver_status_delivered}
																	<svg
																		width="14"
																		height="14"
																		viewBox="0 0 24 24"
																		fill="none"
																		stroke="currentColor"
																		stroke-width="3"
																	>
																		<polyline points="20 6 9 17 4 12"></polyline>
																	</svg>
																{:else if pickupStatus === t.driver_status_picked_up}
																	<svg
																		width="14"
																		height="14"
																		viewBox="0 0 24 24"
																		fill="none"
																		stroke="currentColor"
																		stroke-width="2"
																	>
																		<polyline points="20 6 9 17 4 12"></polyline>
																	</svg>
																{:else}
																	<svg
																		width="14"
																		height="14"
																		viewBox="0 0 24 24"
																		fill="none"
																		stroke="currentColor"
																		stroke-width="2"
																	>
																		<circle cx="12" cy="12" r="10"></circle>
																		<polyline points="12 6 12 12 16 14"></polyline>
																	</svg>
																{/if}
																{pickupStatus}
															</span>
														{:else}
															<span class="status-badge status-pending">
																<svg
																	width="14"
																	height="14"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																>
																	<circle cx="12" cy="12" r="10"></circle>
																	<polyline points="12 6 12 12 16 14"></polyline>
																</svg>
																{t.driver_status_pending}
															</span>
														{/if}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Calendar Section -->
	<section class="content-section">
		<div class="data-table-container">
			<div class="section-header">
				<div>
					<h2 class="section-title">{t.dashboard_section_driver_upcoming_title}</h2>
					<p class="section-desc">{t.dashboard_section_driver_upcoming_description}</p>
				</div>
			</div>

			{#if monthTitle}
				<div class="calendar-wrapper">
					<div class="calendar-header">
						<a
							class="nav-link"
							href="/dashboard?calendarMonth={prevMonth}&selectedDate={selectedDate}"
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
							href="/dashboard?calendarMonth={nextMonth}&selectedDate={selectedDate}"
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
									class:day-assigned={datesWithAssignments.has(dateStr)}
									class:day-selected={dateStr === selectedDate}
									href={buildDayUrl(dateStr)}
								>
									{day}
								</a>
							{/each}
						</div>
					</div>
					<p class="calendar-hint">
						Days when you have assignments are highlighted. Click a day to see your routes.
					</p>
				</div>
			{:else}
				<div class="empty-state">
					<p>{t.dashboard_section_driver_upcoming_placeholder}</p>
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.driver-dashboard {
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

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #ffffff;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.stat-card:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.stat-icon svg {
		width: 24px;
		height: 24px;
	}

	.icon-primary {
		background: rgba(26, 26, 26, 0.08);
		color: var(--color-primary, #1a1a1a);
	}

	.icon-accent {
		background: rgba(196, 167, 125, 0.15);
		color: var(--color-accent, #c4a77d);
	}

	.icon-success {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.stat-content {
		flex: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color-text-light, #666666);
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		letter-spacing: -0.01em;
	}

	/* Content Section */
	.content-section {
		margin-bottom: 2rem;
	}

	.data-table-container {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.section-header {
		padding: 1.5rem;
		background: var(--color-secondary, #f5f5f0);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
		margin: 0 0 0.25rem 0;
	}

	.section-desc {
		font-size: 0.9375rem;
		color: var(--color-text-light, #666666);
		margin: 0;
	}

	/* Empty State */
	.empty-state {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-light, #666666);
		font-size: 1.1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.empty-state svg {
		color: var(--color-accent, #c4a77d);
	}

	/* Routes List */
	.routes-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
	}

	.route-card {
		background: var(--color-secondary, #f5f5f0);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.route-card:hover {
		background: #ebebe6;
	}

	.route-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		cursor: pointer;
	}

	.route-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.route-icon {
		width: 48px;
		height: 48px;
		border-radius: 10px;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.route-icon svg {
		width: 24px;
		height: 24px;
		color: var(--color-accent, #c4a77d);
	}

	.route-main h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	.route-meta {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-light, #666666);
	}

	.route-actions {
		display: flex;
		align-items: center;
	}

	.expand-text {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #ffffff;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 8px;
		color: var(--color-text, #333333);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.expand-text:hover {
		background: var(--color-secondary, #f5f5f0);
		border-color: var(--color-text-light, #666666);
	}

	/* Route Details */
	.route-details {
		padding: 0 1.5rem 1.5rem 1.5rem;
		border-top: 1px solid var(--color-border, #e0e0e0);
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.pickup-table {
		width: 100%;
		border-collapse: collapse;
		background: #ffffff;
		border-radius: 8px;
		overflow: hidden;
		margin-top: 1rem;
	}

	.pickup-table thead {
		background: var(--color-secondary, #f5f5f0);
	}

	.pickup-table th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.8125rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-light, #666666);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
	}

	.pickup-table td {
		padding: 1rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		font-size: 0.9375rem;
	}

	.pickup-table tbody tr:last-child td {
		border-bottom: none;
	}

	.hotel-name {
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	.bags-count {
		color: var(--color-text, #333333);
		font-weight: 500;
	}

	.status-cell {
		white-space: nowrap;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.status-badge.status-pending {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	.status-badge.status-picked {
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
	}

	.status-badge.status-delivered {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	/* Calendar */
	.calendar-wrapper {
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
		background: #ffffff;
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

	.day-assigned {
		background: rgba(196, 167, 125, 0.15);
		color: var(--color-accent-dark, #a08960);
		font-weight: 600;
	}

	.day-assigned:hover {
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

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr;
		}

		.route-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.pickup-table {
			display: block;
			overflow-x: auto;
		}

		.section-header {
			padding: 1rem;
		}

		.routes-list {
			padding: 1rem;
		}

		.calendar-wrapper {
			padding: 1rem;
		}
	}
</style>

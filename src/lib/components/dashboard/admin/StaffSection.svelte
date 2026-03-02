<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	let {
		allStaff,
		form,
		useTeamLabels = false
	} = $props<{
		allStaff: Array<{
			id: string;
			username: string;
			firstName: string | null;
			lastName: string | null;
			role: string;
			licenseNumber: string | null;
		}>;
		form?: { success?: boolean; message?: string };
		useTeamLabels?: boolean;
	}>();

	const t = $derived(translations[$language]);
	const sectionTitle = $derived(useTeamLabels ? (t.team_title ?? 'Team') : t.staff_title);
	const addLabel = $derived(useTeamLabels ? (t.team_add ?? 'Add member') : t.staff_add);
	const addNewLabel = $derived(
		useTeamLabels ? (t.team_add_new ?? 'Add new team member') : t.staff_add_new
	);
	const emptyLabel = $derived(
		useTeamLabels ? (t.team_empty ?? 'No team members yet.') : t.staff_empty
	);
	const successLabel = $derived(
		useTeamLabels ? (t.team_success ?? 'Team member added') : t.staff_success
	);

	let showAddForm = $state(false);
	let staffSearch = $state('');

	type StaffMember = {
		id: string;
		username: string;
		firstName: string | null;
		lastName: string | null;
		role: string;
		licenseNumber: string | null;
	};

	const filteredStaff = $derived(
		(allStaff as StaffMember[]).filter((s: StaffMember) => {
			const q = staffSearch.trim().toLowerCase();
			if (!q) return true;
			return (
				s.username.toLowerCase().includes(q) ||
				(s.firstName ?? '').toLowerCase().includes(q) ||
				(s.lastName ?? '').toLowerCase().includes(q)
			);
		})
	);

	// Sorting
	type SortColumn = 'email' | 'firstName' | 'lastName' | 'role' | 'license' | null;
	let sortColumn = $state<SortColumn>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	const sortedStaff = $derived(() => {
		if (!sortColumn) return filteredStaff;
		return [...filteredStaff].sort((a, b) => {
			let valA: string, valB: string;
			switch (sortColumn) {
				case 'email':
					valA = a.username.toLowerCase();
					valB = b.username.toLowerCase();
					break;
				case 'firstName':
					valA = (a.firstName || '').toLowerCase();
					valB = (b.firstName || '').toLowerCase();
					break;
				case 'lastName':
					valA = (a.lastName || '').toLowerCase();
					valB = (b.lastName || '').toLowerCase();
					break;
				case 'role':
					valA = a.role.toLowerCase();
					valB = b.role.toLowerCase();
					break;
				case 'license':
					valA = (a.licenseNumber || '').toLowerCase();
					valB = (b.licenseNumber || '').toLowerCase();
					break;
				default:
					return 0;
			}
			if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
			if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	});

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	};

	// Pagination
	const PAGE_SIZE = 10;
	let currentPage = $state(0);
	const totalPages = $derived(Math.max(1, Math.ceil(sortedStaff().length / PAGE_SIZE)));
	const paginatedStaff = $derived(
		sortedStaff().slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
	);
</script>

{#if form?.success}
	<div class="success-message">{form.message || successLabel}</div>
{/if}
{#if form?.message && !form?.success}
	<div class="error-message">{form.message}</div>
{/if}

<div class="staff-section">
	<!-- Table Header with Filters -->
	<div class="data-table-header">
		<div class="search-box">
			<svg
				class="search-icon"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
			<input
				type="text"
				class="search-input"
				placeholder={t.team_search_placeholder ?? 'Pesquisar na equipa…'}
				bind:value={staffSearch}
			/>
		</div>
		<div class="filter-group-inline">
			{#if !showAddForm}
				<button
					class="btn btn-primary"
					type="button"
					onclick={() => {
						showAddForm = true;
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					{addLabel}
				</button>
			{/if}
		</div>
	</div>

	{#if showAddForm}
		<div class="add-form">
			<h4>{addNewLabel}</h4>
			<form
				method="POST"
				action="?/createStaff"
				onsubmit={() => {
					setTimeout(() => {
						showAddForm = false;
					}, 100);
				}}
			>
				<div class="form-row">
					<div class="form-group">
						<label for="staff-email">{t.staff_email}</label>
						<input id="staff-email" type="email" name="username" required />
						<span class="form-hint">{t.staff_email_hint}</span>
					</div>
					<div class="form-group">
						<label for="staff-password">{t.staff_password}</label>
						<input id="staff-password" type="password" name="password" required minlength="6" />
					</div>
					<div class="form-group">
						<label for="staff-role">{t.staff_role}</label>
						<select id="staff-role" name="role" required>
							<option value="admin">{t.dashboard_role_admin}</option>
							<option value="driver">{t.dashboard_role_driver}</option>
						</select>
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label for="staff-first-name">{t.staff_first_name}</label>
						<input id="staff-first-name" type="text" name="firstName" required />
					</div>
					<div class="form-group">
						<label for="staff-last-name">{t.staff_last_name}</label>
						<input id="staff-last-name" type="text" name="lastName" required />
					</div>
					<div class="form-group">
						<label for="staff-license">{t.staff_license}</label>
						<input id="staff-license" type="text" name="licenseNumber" />
						<span class="form-hint">{t.staff_license_hint}</span>
					</div>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn-submit">{addLabel}</button>
					<button
						type="button"
						class="btn-cancel"
						onclick={() => {
							showAddForm = false;
						}}>{t.staff_cancel}</button
					>
				</div>
			</form>
		</div>
	{/if}

	{#if allStaff.length === 0}
		<p class="empty-state">{emptyLabel}</p>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					<th class="sortable" onclick={() => handleSort('email')}>
						<div class="th-content">
							{t.staff_email}
							{#if sortColumn === 'email'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('firstName')}>
						<div class="th-content">
							{t.staff_first_name}
							{#if sortColumn === 'firstName'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('lastName')}>
						<div class="th-content">
							{t.staff_last_name}
							{#if sortColumn === 'lastName'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('role')}>
						<div class="th-content">
							{t.staff_role}
							{#if sortColumn === 'role'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('license')}>
						<div class="th-content">
							{t.staff_license}
							{#if sortColumn === 'license'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th>{t.staff_actions}</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedStaff as staff}
					<tr>
						<td>{staff.username}</td>
						<td>{staff.firstName || '—'}</td>
						<td>{staff.lastName || '—'}</td>
						<td>
							<span class="role-badge role-{staff.role}">
								{staff.role === 'admin' ? t.dashboard_role_admin : t.dashboard_role_driver}
							</span>
						</td>
						<td>{staff.licenseNumber || '—'}</td>
						<td class="actions">
							<div class="actions-wrapper">
								<button type="button" class="action-btn" title="View">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle
											cx="12"
											cy="12"
											r="3"
										/></svg
									>
								</button>
								<button type="button" class="action-btn" title="Edit">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg
									>
								</button>
								<form
									method="POST"
									action="?/removeStaff"
									class="inline-form"
									style="display: inline-flex;"
								>
									<input type="hidden" name="staffId" value={staff.id} />
									<button type="submit" class="action-btn" title={t.staff_remove}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><polyline points="3 6 5 6 21 6" /><path
												d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
											/></svg
										>
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if allStaff.length > PAGE_SIZE}
			<div class="pagination-container">
				<span class="pagination-info">
					{t.bookings_table_showing
						?.replace('{start}', String(currentPage * PAGE_SIZE + 1))
						.replace('{end}', String(Math.min((currentPage + 1) * PAGE_SIZE, allStaff.length)))
						.replace('{total}', String(allStaff.length)) ??
						`Showing ${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, allStaff.length)} of ${allStaff.length}`}
				</span>
				<div class="pagination-buttons">
					<button
						type="button"
						class="page-btn"
						disabled={currentPage === 0}
						onclick={() => {
							currentPage = Math.max(0, currentPage - 1);
						}}
					>
						←
					</button>
					{#each Array(totalPages) as _, i}
						<button
							type="button"
							class="page-btn"
							class:active={currentPage === i}
							onclick={() => {
								currentPage = i;
							}}
						>
							{i + 1}
						</button>
					{/each}
					<button
						type="button"
						class="page-btn"
						disabled={currentPage >= totalPages - 1}
						onclick={() => {
							currentPage = Math.min(totalPages - 1, currentPage + 1);
						}}
					>
						→
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.staff-section {
		width: 100%;
	}

	/* Header with filters */
	.data-table-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		background: var(--color-secondary, #f5f5f0);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		gap: 1rem;
		flex-wrap: wrap;
	}

	.search-box {
		flex: 1;
		min-width: 250px;
		position: relative;
	}

	.search-icon {
		position: absolute;
		left: 0.875rem;
		top: 50%;
		transform: translateY(-50%);
		width: 18px;
		height: 18px;
		color: var(--color-text-light, #666666);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0.625rem 1rem 0.625rem 2.5rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.9375rem;
		background: #ffffff;
		color: var(--color-text, #333333);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-accent, #c4a77d);
		box-shadow: 0 0 0 4px rgba(196, 167, 125, 0.1);
	}

	.search-input::placeholder {
		color: var(--color-text-light, #666666);
	}

	.filter-group-inline {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 500;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
	}

	.btn-primary {
		background: var(--color-accent, #c4a77d);
		color: #ffffff;
	}

	.btn-primary:hover {
		background: var(--color-accent-dark, #a08960);
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	/* Add Form */
	.add-form {
		background: var(--color-secondary, #f5f5f0);
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
	}

	.add-form h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	.form-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		flex: 1;
		min-width: 180px;
	}

	.form-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.35rem;
		color: var(--color-text, #333333);
	}

	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9rem;
		font-family: inherit;
		background: white;
		transition: all 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--color-accent, #c4a77d);
		box-shadow: 0 0 0 3px rgba(196, 167, 125, 0.1);
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-text-light, #666666);
		display: block;
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.btn-submit {
		padding: 0.5rem 1rem;
		background: var(--color-accent, #c4a77d);
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.btn-submit:hover {
		background: var(--color-accent-dark, #a08960);
	}

	.btn-cancel {
		padding: 0.5rem 1rem;
		background: var(--color-secondary, #f5f5f0);
		color: var(--color-text, #333333);
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.btn-cancel:hover {
		background: var(--color-border, #e0e0e0);
	}

	/* Table styling */
	.data-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		min-width: 800px;
	}

	.data-table thead {
		background: var(--color-secondary, #f5f5f0);
	}

	.data-table th {
		padding: 1rem 1.25rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.8125rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text-light, #666666);
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		white-space: nowrap;
	}

	.data-table th.sortable {
		cursor: pointer;
		user-select: none;
		transition: background-color 0.2s ease;
	}

	.data-table th.sortable:hover {
		background: #ebebe6;
	}

	.th-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-indicator {
		font-size: 0.75rem;
		color: var(--color-accent, #c4a77d);
	}

	.data-table td {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
		font-size: 0.9375rem;
		color: var(--color-text, #333333);
	}

	.data-table tbody tr:hover {
		background: rgba(245, 245, 240, 0.5);
	}

	.data-table tbody tr:last-child td {
		border-bottom: none;
	}

	/* Role Badge */
	.role-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.role-admin {
		background: rgba(26, 26, 26, 0.08);
		color: var(--color-primary, #1a1a1a);
	}

	.role-driver {
		background: rgba(196, 167, 125, 0.15);
		color: var(--color-accent-dark, #a08960);
	}

	/* Actions */
	.actions {
		white-space: nowrap;
	}

	.actions-wrapper {
		display: inline-flex;
		gap: 0.375rem;
		align-items: center;
		vertical-align: middle;
	}

	.action-btn {
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		color: var(--color-text-light, #666666);
		padding: 0;
		vertical-align: middle;
	}

	.action-btn svg {
		display: block;
		flex-shrink: 0;
	}

	.action-btn:hover {
		background: var(--color-secondary, #f5f5f0);
		color: var(--color-text, #333333);
	}

	.inline-form {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		margin: 0;
		vertical-align: middle;
	}

	/* Pagination */
	.pagination-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: var(--color-secondary, #f5f5f0);
		border-top: 1px solid var(--color-border, #e0e0e0);
	}

	.pagination-info {
		font-size: 0.875rem;
		color: var(--color-text-light, #666666);
	}

	.pagination-buttons {
		display: flex;
		gap: 0.25rem;
	}

	.page-btn {
		padding: 0.5rem 0.75rem;
		background: white;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 6px;
		font-family: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 36px;
		font-weight: 500;
	}

	.page-btn:hover:not(:disabled):not(.active) {
		background: var(--color-secondary, #f5f5f0);
	}

	.page-btn.active {
		background: var(--color-primary, #1a1a1a);
		color: white;
		border-color: var(--color-primary, #1a1a1a);
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Messages */
	.success-message {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		padding: 1rem 1.25rem;
		border-radius: 8px;
		margin: 1rem 1.5rem;
		font-weight: 500;
	}

	.error-message {
		background: rgba(220, 38, 38, 0.1);
		color: #dc2626;
		padding: 1rem 1.25rem;
		border-radius: 8px;
		margin: 1rem 1.5rem;
		font-weight: 500;
	}

	/* Empty State */
	.empty-state {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-light, #666666);
		font-style: italic;
		font-size: 1rem;
	}

	@media (max-width: 768px) {
		.data-table {
			display: block;
			overflow-x: auto;
		}

		.data-table-header {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			min-width: auto;
		}

		.form-row {
			flex-direction: column;
		}

		.form-group {
			min-width: auto;
		}

		.pagination-container {
			flex-direction: column;
			gap: 1rem;
		}

		.pagination-info {
			order: 2;
		}

		.pagination-buttons {
			order: 1;
		}
	}
</style>

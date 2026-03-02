<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import ViewModal from './ViewModal.svelte';

	let { customers, form } = $props<{
		customers: Array<{
			id: string;
			username: string;
			firstName: string | null;
			lastName: string | null;
		}>;
		form?: { success?: boolean; message?: string };
	}>();

	const t = $derived(translations[$language]);
	let editingId = $state<string | null>(null);
	let viewingCustomer = $state<{
		id: string;
		username: string;
		firstName: string | null;
		lastName: string | null;
	} | null>(null);

	let search = $state('');

	type Customer = {
		id: string;
		username: string;
		firstName: string | null;
		lastName: string | null;
	};

	const filteredCustomers = $derived(
		((customers ?? []) as Customer[]).filter((c) => {
			const q = search.trim().toLowerCase();
			if (!q) return true;
			return (
				c.username.toLowerCase().includes(q) ||
				(c.firstName ?? '').toLowerCase().includes(q) ||
				(c.lastName ?? '').toLowerCase().includes(q) ||
				c.id.toLowerCase().includes(q)
			);
		})
	);

	// Sorting
	type SortColumn = 'id' | 'username' | 'firstName' | 'lastName' | null;
	let sortColumn = $state<SortColumn>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	const sortedCustomers = $derived(() => {
		if (!sortColumn) return filteredCustomers;
		return [...filteredCustomers].sort((a, b) => {
			let valA: string, valB: string;
			switch (sortColumn) {
				case 'id':
					valA = a.id.toLowerCase();
					valB = b.id.toLowerCase();
					break;
				case 'username':
					valA = a.username.toLowerCase();
					valB = b.username.toLowerCase();
					break;
				case 'firstName':
					valA = (a.firstName ?? '').toLowerCase();
					valB = (b.firstName ?? '').toLowerCase();
					break;
				case 'lastName':
					valA = (a.lastName ?? '').toLowerCase();
					valB = (b.lastName ?? '').toLowerCase();
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

	const startEdit = (customer: { id: string; username: string }) => {
		editingId = customer.id;
	};

	const cancelEdit = () => {
		editingId = null;
	};

	const viewCustomer = (customer: {
		id: string;
		username: string;
		firstName: string | null;
		lastName: string | null;
	}) => {
		viewingCustomer = customer;
	};

	const closeView = () => {
		viewingCustomer = null;
	};

	// Pagination
	const PAGE_SIZE = 10;
	let currentPage = $state(0);
	const totalPages = $derived(Math.max(1, Math.ceil(sortedCustomers().length / PAGE_SIZE)));
	const paginatedCustomers = $derived(
		sortedCustomers().slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
	);
</script>

{#if form?.success}
	<div class="success-message">{form.message || t.admin_operation_ok}</div>
{/if}

{#if form?.message && !form?.success}
	<div class="error-message">{form.message}</div>
{/if}

<div class="table-container">
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
				placeholder={t.customers_table_search_placeholder}
				bind:value={search}
			/>
		</div>
		<div class="filter-group-inline">
			<button class="btn btn-primary" type="button">
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
				{t.customers_table_add}
			</button>
		</div>
	</div>

	{#if filteredCustomers.length === 0}
		<p class="empty-state">{t.customers_table_empty}</p>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					<th class="sortable" onclick={() => handleSort('id')}>
						<div class="th-content">
							{t.bookings_table_id}
							{#if sortColumn === 'id'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('username')}>
						<div class="th-content">
							{t.customers_table_username}
							{#if sortColumn === 'username'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('firstName')}>
						<div class="th-content">
							{t.customers_table_first_name ?? 'First Name'}
							{#if sortColumn === 'firstName'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('lastName')}>
						<div class="th-content">
							{t.customers_table_last_name ?? 'Last Name'}
							{#if sortColumn === 'lastName'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th>{t.customers_table_actions}</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedCustomers as customer}
					<tr>
						<td class="mono">{customer.id.slice(0, 8)}...</td>
						<td>
							{#if editingId === customer.id}
								<form method="POST" action="?/updateCustomer" class="inline-form">
									<input type="hidden" name="customerId" value={customer.id} />
									<input
										type="text"
										name="username"
										value={customer.username}
										required
										class="edit-input"
									/>
									<button type="submit" class="btn-save">{t.bookings_table_save}</button>
									<button type="button" class="btn-cancel" onclick={cancelEdit}
										>{t.bookings_table_cancel}</button
									>
								</form>
							{:else}
								{customer.username}
							{/if}
						</td>
						<td>{customer.firstName || '—'}</td>
						<td>{customer.lastName || '—'}</td>
						<td class="actions">
							{#if editingId !== customer.id}
								<div class="actions-wrapper">
									<button
										type="button"
										class="action-btn"
										onclick={() => viewCustomer(customer)}
										title={t.bookings_table_view}
									>
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
									<button
										type="button"
										class="action-btn"
										onclick={() => startEdit(customer)}
										title={t.bookings_table_edit}
									>
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
										action="?/deleteCustomer"
										class="inline-form"
										style="display: inline-flex;"
									>
										<input type="hidden" name="customerId" value={customer.id} />
										<button type="submit" class="action-btn" title={t.bookings_table_delete}>
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
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if filteredCustomers.length > PAGE_SIZE}
			<div class="pagination-container">
				<span class="pagination-info">
					{t.bookings_table_showing
						?.replace('{start}', String(currentPage * PAGE_SIZE + 1))
						.replace(
							'{end}',
							String(Math.min((currentPage + 1) * PAGE_SIZE, filteredCustomers.length))
						)
						.replace('{total}', String(filteredCustomers.length)) ??
						`Showing ${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, filteredCustomers.length)} of ${filteredCustomers.length}`}
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

{#if viewingCustomer}
	<ViewModal title={t.customers_modal_title} isOpen={!!viewingCustomer} onClose={closeView}>
		<div class="view-details">
			<div class="detail-row">
				<strong>{t.bookings_table_id}:</strong>
				<span>{viewingCustomer.id}</span>
			</div>
			<div class="detail-row">
				<strong>{t.customers_table_username}:</strong>
				<span>{viewingCustomer.username}</span>
			</div>
			<div class="detail-row">
				<strong>{t.customers_table_first_name ?? 'First Name'}:</strong>
				<span>{viewingCustomer.firstName || '—'}</span>
			</div>
			<div class="detail-row">
				<strong>{t.customers_table_last_name ?? 'Last Name'}:</strong>
				<span>{viewingCustomer.lastName || '—'}</span>
			</div>
		</div>
	</ViewModal>
{/if}

<style>
	.table-container {
		width: 100%;
		overflow-x: auto;
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

	/* Table styling */
	.data-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		min-width: 600px;
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

	.mono {
		font-family: monospace;
		font-size: 0.85rem;
		color: var(--color-text-light, #666666);
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

	/* Edit form */
	.edit-input {
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: inherit;
		background: white;
	}

	.edit-input:focus {
		outline: none;
		border-color: var(--color-accent, #c4a77d);
	}

	.btn-save,
	.btn-cancel {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.btn-save {
		background: var(--color-accent, #c4a77d);
		color: white;
	}

	.btn-save:hover {
		background: var(--color-accent-dark, #a08960);
	}

	.btn-cancel {
		background: var(--color-secondary, #f5f5f0);
		color: var(--color-text, #333333);
	}

	.btn-cancel:hover {
		background: var(--color-border, #e0e0e0);
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

	/* View Modal Details */
	.view-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.detail-row {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-row strong {
		min-width: 150px;
		color: var(--color-primary, #1a1a1a);
		font-weight: 600;
	}

	.detail-row span {
		color: var(--color-text, #333333);
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

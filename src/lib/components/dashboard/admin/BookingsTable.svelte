<script lang="ts">
	import { STAGES } from '$lib/trail';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import ViewModal from './ViewModal.svelte';
	import AdminIcon from '$lib/components/admin/AdminIcon.svelte';

	let { bookings, form } = $props<{
		bookings: Array<{
			id: string;
			userId: string | null;
			status: string | null;
			firstName?: string | null;
			lastName?: string | null;
			userFirstName?: string | null;
			userLastName?: string | null;
			email: string | null;
			phone: string | null;
			departureDate: Date | null;
			departureStageId: string | null;
			destinationStageId: string | null;
			totalPrice: string | null;
			createdAt: Date | null;
		}>;
		form?: { success?: boolean; message?: string };
	}>();

	const t = $derived(translations[$language]);
	const stageNames = Object.fromEntries(STAGES.map((s) => [s.id, s.name]));

	// Sorting state
	type SortColumn =
		| 'id'
		| 'customer'
		| 'email'
		| 'route'
		| 'date'
		| 'status'
		| 'price'
		| 'created'
		| null;
	let sortColumn = $state<SortColumn>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	const formatDate = (date: Date | null) => {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	const formatPrice = (price: string | null) => {
		if (!price) return '—';
		const num = parseFloat(price);
		if (isNaN(num)) return '—';
		return `€${num.toFixed(2)}`;
	};

	const getCustomerName = (booking: any) => {
		const first = booking.userFirstName ?? booking.firstName ?? '';
		const last = booking.userLastName ?? booking.lastName ?? '';
		const full = `${first} ${last}`.trim();
		return full || '—';
	};

	const getRoute = (booking: any) => {
		const from = stageNames[booking.departureStageId || ''] || booking.departureStageId || '—';
		const to = stageNames[booking.destinationStageId || ''] || booking.destinationStageId || '—';
		return `${from} → ${to}`;
	};

	// Sorting function
	const sortedBookings = $derived(() => {
		if (!sortColumn) return bookings;

		return [...bookings].sort((a, b) => {
			let valA: any;
			let valB: any;

			switch (sortColumn) {
				case 'id':
					valA = a.id;
					valB = b.id;
					break;
				case 'customer':
					valA = getCustomerName(a).toLowerCase();
					valB = getCustomerName(b).toLowerCase();
					break;
				case 'email':
					valA = (a.email || '').toLowerCase();
					valB = (b.email || '').toLowerCase();
					break;
				case 'route':
					valA = getRoute(a).toLowerCase();
					valB = getRoute(b).toLowerCase();
					break;
				case 'date':
					valA = a.departureDate ? new Date(a.departureDate).getTime() : 0;
					valB = b.departureDate ? new Date(b.departureDate).getTime() : 0;
					break;
				case 'status':
					valA = a.status || 'pending';
					valB = b.status || 'pending';
					break;
				case 'price':
					valA = parseFloat(a.totalPrice || '0');
					valB = parseFloat(b.totalPrice || '0');
					break;
				case 'created':
					valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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

	const PAGE_SIZE = 10;
	let currentPage = $state(0);
	const totalPages = $derived(Math.max(1, Math.ceil(sortedBookings().length / PAGE_SIZE)));
	const paginatedBookings = $derived(
		sortedBookings().slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
	);

	let editingId = $state<string | null>(null);
	let viewingBooking = $state<any | null>(null);

	const startEdit = (booking: any) => {
		editingId = booking.id;
	};

	const cancelEdit = () => {
		editingId = null;
	};

	const viewBooking = (booking: any) => {
		viewingBooking = booking;
	};

	const closeView = () => {
		viewingBooking = null;
	};

	// Reset to page 0 when sorting changes
	$effect(() => {
		if (sortColumn || sortDirection) {
			currentPage = 0;
		}
	});
</script>

{#if form?.success}
	<div class="success-message">{form.message || t.bookings_table_operation_ok}</div>
{/if}

{#if form?.message && !form?.success}
	<div class="error-message">{form.message}</div>
{/if}

<div class="table-container">
	{#if bookings.length === 0}
		<p class="empty-state">{t.bookings_table_empty}</p>
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
					<th class="sortable" onclick={() => handleSort('customer')}>
						<div class="th-content">
							{t.bookings_table_customer}
							{#if sortColumn === 'customer'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('email')}>
						<div class="th-content">
							{t.bookings_table_email}
							{#if sortColumn === 'email'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th>{t.bookings_table_phone}</th>
					<th class="sortable" onclick={() => handleSort('route')}>
						<div class="th-content">
							{t.bookings_table_route}
							{#if sortColumn === 'route'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('date')}>
						<div class="th-content">
							{t.bookings_table_date}
							{#if sortColumn === 'date'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('status')}>
						<div class="th-content">
							{t.bookings_table_status}
							{#if sortColumn === 'status'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('price')}>
						<div class="th-content">
							{t.bookings_table_price}
							{#if sortColumn === 'price'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('created')}>
						<div class="th-content">
							{t.bookings_table_created}
							{#if sortColumn === 'created'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th>{t.bookings_table_actions}</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedBookings as booking}
					<tr>
						<td class="mono">{booking.id.slice(0, 8)}...</td>
						<td>{getCustomerName(booking)}</td>
						<td>{booking.email || '—'}</td>
						<td>{booking.phone || '—'}</td>
						<td>{getRoute(booking)}</td>
						<td>{formatDate(booking.departureDate)}</td>
						<td>
							<span class="status-badge status-{booking.status || 'pending'}">
								{booking.status || 'pending'}
							</span>
						</td>
						<td class="price">{formatPrice(booking.totalPrice)}</td>
						<td>{formatDate(booking.createdAt)}</td>
						<td class="actions">
							{#if editingId === booking.id}
								<form method="POST" action="?/updateBooking" class="inline-form">
									<input type="hidden" name="bookingId" value={booking.id} />
									<select name="status" class="status-select">
										<option value="pending" selected={booking.status === 'pending'}>pending</option>
										<option value="paid" selected={booking.status === 'paid'}>paid</option>
										<option value="cancelled" selected={booking.status === 'cancelled'}
											>cancelled</option
										>
									</select>
									<button type="submit" class="btn-save">{t.bookings_table_save}</button>
									<button type="button" class="btn-cancel" onclick={cancelEdit}
										>{t.bookings_table_cancel}</button
									>
								</form>
							{:else}
								<div class="actions-wrapper">
									<a
										href="/dashboard/booking/{booking.id}/bags"
										class="action-btn"
										title={t.bookings_table_bag_links}
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
											><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path
												d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
											/><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line
												x1="12"
												y1="22.08"
												x2="12"
												y2="12"
											/></svg
										>
									</a>
									<button
										type="button"
										class="action-btn"
										onclick={() => viewBooking(booking)}
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
										onclick={() => startEdit(booking)}
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
										action="?/deleteBooking"
										class="inline-form"
										style="display: inline-flex;"
									>
										<input type="hidden" name="bookingId" value={booking.id} />
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
		{#if bookings.length > PAGE_SIZE}
			<div class="pagination-container">
				<span class="pagination-info">
					{t.bookings_table_showing
						?.replace('{start}', String(currentPage * PAGE_SIZE + 1))
						.replace('{end}', String(Math.min((currentPage + 1) * PAGE_SIZE, bookings.length)))
						.replace('{total}', String(bookings.length)) ??
						`Showing ${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, bookings.length)} of ${bookings.length}`}
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

{#if viewingBooking}
	<ViewModal title={t.bookings_modal_title} isOpen={!!viewingBooking} onClose={closeView}>
		<div class="view-details">
			<div class="detail-row">
				<strong>{t.bookings_table_id}:</strong>
				<span>{viewingBooking.id}</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_table_customer}:</strong>
				<span>{getCustomerName(viewingBooking)}</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_table_email}:</strong>
				<span>{viewingBooking.email || '—'}</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_table_phone}:</strong>
				<span>{viewingBooking.phone || '—'}</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_table_route}:</strong>
				<span>{getRoute(viewingBooking)}</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_modal_departure_date}:</strong>
				<span>{formatDate(viewingBooking.departureDate)}</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_table_status}:</strong>
				<span>
					<span class="status-badge status-{viewingBooking.status || 'pending'}">
						{viewingBooking.status || 'pending'}
					</span>
				</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_modal_total_price}:</strong>
				<span>{formatPrice(viewingBooking.totalPrice)}</span>
			</div>
			<div class="detail-row">
				<strong>{t.bookings_table_created}:</strong>
				<span>{formatDate(viewingBooking.createdAt)}</span>
			</div>
		</div>
	</ViewModal>
{/if}

<style>
	.table-container {
		width: 100%;
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		min-width: 1200px;
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

	.price {
		font-weight: 600;
		color: var(--color-primary, #1a1a1a);
	}

	/* Status Badges */
	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-paid {
		background: rgba(34, 197, 94, 0.12);
		color: #22c55e;
	}

	.status-pending {
		background: rgba(245, 158, 11, 0.12);
		color: #f59e0b;
	}

	.status-cancelled {
		background: rgba(220, 38, 38, 0.12);
		color: #dc2626;
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

	.status-select {
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 6px;
		font-size: 0.875rem;
		font-family: inherit;
		background: white;
		cursor: pointer;
	}

	.status-select:focus {
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

	/* Empty State */
	.empty-state {
		padding: 3rem 2rem;
		text-align: center;
		color: var(--color-text-light, #666666);
		font-style: italic;
		font-size: 1rem;
	}

	/* Success/Error Messages */
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

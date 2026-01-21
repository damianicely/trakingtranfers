<script lang="ts">
	import { STAGES } from '$lib/trail';
	import ViewModal from './ViewModal.svelte';

	let { bookings, form } = $props<{
		bookings: Array<{
			id: string;
			userId: string | null;
			status: string | null;
			firstName: string | null;
			lastName: string | null;
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

	const stageNames = Object.fromEntries(STAGES.map((s) => [s.id, s.name]));

	const formatDate = (date: Date | null) => {
		if (!date) return '—';
		return new Date(date).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

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
</script>

{#if form?.success}
	<div class="success-message">{form.message || 'Operation successful'}</div>
{/if}

{#if form?.message && !form?.success}
	<div class="error-message">{form.message}</div>
{/if}

<div class="table-container">
	{#if bookings.length === 0}
		<p class="empty-state">No bookings found.</p>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Customer</th>
					<th>Email</th>
					<th>Phone</th>
					<th>Route</th>
					<th>Date</th>
					<th>Status</th>
					<th>Price</th>
					<th>Created</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each bookings as booking}
					<tr>
						<td class="mono">{booking.id.slice(0, 8)}...</td>
						<td>
							{booking.firstName || ''} {booking.lastName || ''}
							{#if !booking.firstName && !booking.lastName}
								<span class="muted">—</span>
							{/if}
						</td>
						<td>{booking.email || '—'}</td>
						<td>{booking.phone || '—'}</td>
						<td>
							{stageNames[booking.departureStageId || ''] || booking.departureStageId || '—'} →
							{stageNames[booking.destinationStageId || ''] || booking.destinationStageId || '—'}
						</td>
						<td>{formatDate(booking.departureDate)}</td>
						<td>
							<span class="status-badge status-{booking.status || 'pending'}">
								{booking.status || 'pending'}
							</span>
						</td>
						<td>{booking.totalPrice ? `€${booking.totalPrice}` : '—'}</td>
						<td>{formatDate(booking.createdAt)}</td>
						<td class="actions">
							{#if editingId === booking.id}
								<form method="POST" action="?/updateBooking" class="inline-form">
									<input type="hidden" name="bookingId" value={booking.id} />
									<select name="status" class="status-select">
										<option value="pending" selected={booking.status === 'pending'}>pending</option>
										<option value="paid" selected={booking.status === 'paid'}>paid</option>
										<option value="cancelled" selected={booking.status === 'cancelled'}>cancelled</option>
									</select>
									<button type="submit" class="btn-save">Save</button>
									<button type="button" class="btn-cancel" onclick={cancelEdit}>Cancel</button>
								</form>
							{:else}
								<button
									type="button"
									class="btn-icon btn-view"
									onclick={() => viewBooking(booking)}
									title="View"
								>
									👁
								</button>
								<button
									type="button"
									class="btn-icon btn-edit"
									onclick={() => startEdit(booking)}
									title="Edit"
								>
									✎
								</button>
								<form method="POST" action="?/deleteBooking" class="inline-form">
									<input type="hidden" name="bookingId" value={booking.id} />
									<button type="submit" class="btn-icon btn-delete" title="Delete">×</button>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

{#if viewingBooking}
	<ViewModal title="Booking Details" isOpen={!!viewingBooking} onClose={closeView}>
		<div class="view-details">
			<div class="detail-row">
				<strong>ID:</strong>
				<span>{viewingBooking.id}</span>
			</div>
			<div class="detail-row">
				<strong>Customer:</strong>
				<span>
					{viewingBooking.firstName || ''} {viewingBooking.lastName || ''}
					{#if !viewingBooking.firstName && !viewingBooking.lastName}
						<span class="muted">—</span>
					{/if}
				</span>
			</div>
			<div class="detail-row">
				<strong>Email:</strong>
				<span>{viewingBooking.email || '—'}</span>
			</div>
			<div class="detail-row">
				<strong>Phone:</strong>
				<span>{viewingBooking.phone || '—'}</span>
			</div>
			<div class="detail-row">
				<strong>Route:</strong>
				<span>
					{stageNames[viewingBooking.departureStageId || ''] || viewingBooking.departureStageId || '—'} →
					{stageNames[viewingBooking.destinationStageId || ''] || viewingBooking.destinationStageId || '—'}
				</span>
			</div>
			<div class="detail-row">
				<strong>Departure Date:</strong>
				<span>{formatDate(viewingBooking.departureDate)}</span>
			</div>
			<div class="detail-row">
				<strong>Status:</strong>
				<span>
					<span class="status-badge status-{viewingBooking.status || 'pending'}">
						{viewingBooking.status || 'pending'}
					</span>
				</span>
			</div>
			<div class="detail-row">
				<strong>Total Price:</strong>
				<span>{viewingBooking.totalPrice ? `€${viewingBooking.totalPrice}` : '—'}</span>
			</div>
			<div class="detail-row">
				<strong>Created:</strong>
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

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #999;
		font-style: italic;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		min-width: 1200px;
	}

	.data-table thead {
		background: #f8f9fa;
	}

	.data-table th {
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.9rem;
		color: #333;
		border-bottom: 2px solid #dee2e6;
	}

	.data-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e9ecef;
		font-size: 0.9rem;
	}

	.data-table tbody tr:hover {
		background: #f8f9fa;
	}

	.mono {
		font-family: monospace;
		font-size: 0.85rem;
	}

	.muted {
		color: #999;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		display: inline-block;
	}

	.status-pending {
		background: #fff3cd;
		color: #856404;
	}

	.status-paid {
		background: #d4edda;
		color: #155724;
	}

	.status-cancelled {
		background: #f8d7da;
		color: #721c24;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.inline-form {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		margin: 0;
	}

	.status-select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	.btn-icon {
		padding: 0.4rem 0.6rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		background: transparent;
		transition: background-color 0.2s;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
	}

	.btn-view {
		color: #007bff;
	}

	.btn-view:hover {
		background: #e7f3ff;
	}

	.btn-edit {
		color: #28a745;
	}

	.btn-edit:hover {
		background: #e7f5e7;
	}

	.btn-delete {
		color: #dc3545;
	}

	.btn-delete:hover {
		background: #ffe7e7;
	}

	.btn-save,
	.btn-cancel {
		padding: 0.25rem 0.75rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.btn-save {
		background: #28a745;
		color: white;
	}

	.btn-save:hover {
		background: #218838;
	}

	.btn-cancel {
		background: #6c757d;
		color: white;
	}

	.btn-cancel:hover {
		background: #5a6268;
	}

	.view-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.detail-row {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e9ecef;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-row strong {
		min-width: 150px;
		color: #333;
	}

	.detail-row span {
		color: #666;
	}

	.btn-save {
		background: #28a745;
		color: white;
	}

	.btn-save:hover {
		background: #218838;
	}

	.btn-cancel {
		background: #6c757d;
		color: white;
	}

	.btn-cancel:hover {
		background: #5a6268;
	}

	.success-message {
		background: #d4edda;
		color: #155724;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
</style>

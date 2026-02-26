<script lang="ts">
	import { STAGES } from '$lib/trail';
	import ViewModal from './ViewModal.svelte';
	import AdminIcon from '$lib/components/admin/AdminIcon.svelte';

	let { hotels, hotelsByLocation, form, allHotels } = $props<{
		hotels: Array<{ id: string; locationId: string; name: string; contactInfo: string | null }>;
		hotelsByLocation: Record<string, Array<{ id: string; name: string; contactInfo: string | null }>>;
		form?: { success?: boolean; message?: string };
		/** When provided (e.g. when parent filters hotels for display), use this to resolve hotel by id for edit form. */
		allHotels?: Array<{ id: string; locationId: string; name: string; contactInfo: string | null }>;
	}>();
	const hotelsForLookup = $derived(allHotels ?? hotels);

const stageNames = Object.fromEntries(
	STAGES.map((s: { id: string; name: string }) => [s.id, s.name])
);

type HotelRow = { id: string; locationId: string; name: string; contactInfo: string | null };

let search = $state('');

const PAGE_SIZE = 10;
let currentPage = $state(0);
const filteredHotels = $derived(
	(hotels as HotelRow[]).filter((h) =>
		h.name.toLowerCase().includes(search.trim().toLowerCase())
	)
);
const totalPages = $derived(Math.max(1, Math.ceil(filteredHotels.length / PAGE_SIZE)));
const paginatedHotels = $derived(
	filteredHotels.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
);
	$effect(() => {
		if (totalPages > 0 && currentPage >= totalPages) {
			currentPage = totalPages - 1;
		}
	});

	let editingId = $state<string | null>(null);
	let showAddForm = $state(false);
	let viewingHotel = $state<{ id: string; locationId: string; name: string; contactInfo: string | null } | null>(null);

	const startEdit = (hotel: { id: string; locationId: string; name: string; contactInfo: string | null }) => {
		editingId = hotel.id;
		showAddForm = true;
	};

	const cancelEdit = () => {
		editingId = null;
		showAddForm = false;
	};

	const viewHotel = (hotel: { id: string; locationId: string; name: string; contactInfo: string | null }) => {
		viewingHotel = hotel;
	};

	const closeView = () => {
		viewingHotel = null;
	};
</script>

{#if form?.success}
	<div class="success-message">{form.message || 'Operation successful'}</div>
{/if}

{#if form?.message && !form?.success}
	<div class="error-message">{form.message}</div>
{/if}

<div class="table-container">
	<div class="table-header">
		<h3>Accommodation</h3>
		<div class="header-actions">
			<input
				type="search"
				class="search-input"
				placeholder="Search accommodation…"
				bind:value={search}
				aria-label="Search accommodation"
			/>
			{#if !showAddForm}
				<button type="button" class="btn-add" onclick={() => { showAddForm = true; }}>
					+ Accommodation
				</button>
			{/if}
		</div>
	</div>

	{#if showAddForm}
		<div class="add-form">
			<h4>{editingId ? 'Edit Hotel' : 'Add New Hotel'}</h4>
			<form
				method="POST"
				action={editingId ? '?/updateHotel' : '?/createHotel'}
				onsubmit={() => {
					setTimeout(() => {
						showAddForm = false;
						editingId = null;
					}, 100);
				}}
			>
				{#if editingId}
					{@const hotel = hotelsForLookup.find((h) => h.id === editingId)}
					<input type="hidden" name="hotelId" value={editingId} />
					<div class="form-row">
						<div class="form-group">
							<label>Location</label>
							<select name="locationId" required disabled={!!editingId}>
								<option value="">Select location</option>
								{#each STAGES as stage}
									<option value={stage.id} selected={hotel?.locationId === stage.id}>
										{stage.name} ({stage.id})
									</option>
								{/each}
							</select>
							{#if editingId}
								<input type="hidden" name="locationId" value={hotel?.locationId} />
							{/if}
						</div>
						<div class="form-group">
							<label>Hotel Name</label>
							<input type="text" name="name" required value={hotel?.name || ''} />
						</div>
						<div class="form-group">
							<label>Contact Info</label>
							<textarea name="contactInfo" rows="2">{hotel?.contactInfo || ''}</textarea>
						</div>
					</div>
				{:else}
					<div class="form-row">
						<div class="form-group">
							<label>Location</label>
							<select name="locationId" required>
								<option value="">Select location</option>
								{#each STAGES as stage}
									<option value={stage.id}>{stage.name} ({stage.id})</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label>Hotel Name</label>
							<input type="text" name="name" required />
						</div>
						<div class="form-group">
							<label>Contact Info</label>
							<textarea name="contactInfo" rows="2"></textarea>
						</div>
					</div>
				{/if}
				<div class="form-actions">
					<button type="submit" class="btn-submit">{editingId ? 'Update' : 'Create'}</button>
					<button type="button" class="btn-cancel" onclick={cancelEdit}>Cancel</button>
				</div>
			</form>
		</div>
	{/if}

	{#if hotels.length === 0}
		<p class="empty-state">No hotels added yet.</p>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					<th>Location</th>
					<th>Name</th>
					<th>Contact Info</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedHotels as hotel}
					<tr>
						<td>{stageNames[hotel.locationId] || hotel.locationId}</td>
						<td>{hotel.name}</td>
						<td>{hotel.contactInfo || '—'}</td>
						<td class="actions">
							<button
								type="button"
								class="btn-icon btn-view"
								onclick={() => viewHotel(hotel)}
								title="View"
							>
								<AdminIcon name="eye" size={18} />
							</button>
							<button
								type="button"
								class="btn-icon btn-edit"
								onclick={() => startEdit(hotel)}
								title="Edit"
							>
								<AdminIcon name="edit" size={18} />
							</button>
							<form method="POST" action="?/deleteHotel" class="inline-form">
								<input type="hidden" name="hotelId" value={hotel.id} />
								<button type="submit" class="btn-icon btn-delete" title="Delete">
									<AdminIcon name="trash" size={18} />
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if hotels.length > PAGE_SIZE}
			<div class="pagination">
				<button
					type="button"
					class="pagination-btn"
					disabled={currentPage === 0}
					onclick={() => { currentPage = Math.max(0, currentPage - 1); }}
				>
					Previous
				</button>
				<span class="pagination-info">Page {currentPage + 1} of {totalPages}</span>
				<button
					type="button"
					class="pagination-btn"
					disabled={currentPage >= totalPages - 1}
					onclick={() => { currentPage = Math.min(totalPages - 1, currentPage + 1); }}
				>
					Next
				</button>
			</div>
		{/if}
	{/if}
</div>

{#if viewingHotel}
	<ViewModal
		title="Hotel Details"
		isOpen={!!viewingHotel}
		onClose={closeView}
	>
		<div class="view-details">
			<div class="detail-row">
				<strong>ID:</strong>
				<span>{viewingHotel.id}</span>
			</div>
			<div class="detail-row">
				<strong>Location:</strong>
				<span>{stageNames[viewingHotel.locationId] || viewingHotel.locationId}</span>
			</div>
			<div class="detail-row">
				<strong>Name:</strong>
				<span>{viewingHotel.name}</span>
			</div>
			<div class="detail-row">
				<strong>Contact Info:</strong>
				<span>{viewingHotel.contactInfo || '—'}</span>
			</div>
		</div>
	</ViewModal>
{/if}

<style>
	.table-container {
		width: 100%;
	}

	.table-header {
		display: flex;
	justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.table-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

.header-actions {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.search-input {
	min-width: 200px;
	padding: 0.5rem 0.75rem;
	font-size: 0.9rem;
	border: 1px solid rgba(0, 0, 0, 0.12);
	border-radius: 999px;
	background: #ffffff;
	color: #1a1d21;
}

.search-input::placeholder {
	color: #5f6368;
}

.search-input:focus {
	outline: none;
	border-color: #1a73e8;
	box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.18);
}

	.btn-add {
		padding: 0.5rem 1rem;
		background: #111827;
		color: #f9fafb;
		border: none;
		border-radius: 999px;
		cursor: pointer;
		font-weight: 600;
	}

	.btn-add:hover {
		background: #020617;
	}

	.pagination {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
		padding: 0.5rem 0;
	}
	.pagination-btn {
		padding: 0.4rem 0.8rem;
		background: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.pagination-btn:hover:not(:disabled) {
		background: #e0e0e0;
	}
	.pagination-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.pagination-info {
		font-size: 0.9rem;
		color: #666;
	}

	.add-form {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.add-form h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 2fr 2fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.form-group select:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-submit {
		padding: 0.5rem 1rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-submit:hover {
		background: #0056b3;
	}

	.btn-cancel {
		padding: 0.5rem 1rem;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.btn-cancel:hover {
		background: #5a6268;
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

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.inline-form {
		display: inline;
		margin: 0;
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
		min-width: 120px;
		color: #333;
	}

	.detail-row span {
		color: #666;
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

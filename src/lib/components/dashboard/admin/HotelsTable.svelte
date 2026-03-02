<script lang="ts">
	import { STAGES } from '$lib/trail';
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import ViewModal from './ViewModal.svelte';

	let { hotels, hotelsByLocation, form, allHotels } = $props<{
		hotels: Array<{ id: string; locationId: string; name: string; contactInfo: string | null }>;
		hotelsByLocation: Record<
			string,
			Array<{ id: string; name: string; contactInfo: string | null }>
		>;
		form?: { success?: boolean; message?: string };
		/** When provided (e.g. when parent filters hotels for display), use this to resolve hotel by id for edit form. */
		allHotels?: Array<{ id: string; locationId: string; name: string; contactInfo: string | null }>;
	}>();
	const t = $derived(translations[$language]);
	const hotelsForLookup = $derived(allHotels ?? hotels);

	const stageNames = Object.fromEntries(
		STAGES.map((s: { id: string; name: string }) => [s.id, s.name])
	);

	type HotelRow = { id: string; locationId: string; name: string; contactInfo: string | null };

	let search = $state('');
	let locationFilter = $state('');

	// Sorting
	type SortColumn = 'location' | 'name' | 'contact' | null;
	let sortColumn = $state<SortColumn>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	const filteredHotels = $derived(
		(hotels as HotelRow[]).filter((h) => {
			const matchesSearch = h.name.toLowerCase().includes(search.trim().toLowerCase());
			const matchesLocation = !locationFilter || h.locationId === locationFilter;
			return matchesSearch && matchesLocation;
		})
	);

	const sortedHotels = $derived(() => {
		if (!sortColumn) return filteredHotels;
		return [...filteredHotels].sort((a, b) => {
			let valA: string, valB: string;
			switch (sortColumn) {
				case 'location':
					valA = (stageNames[a.locationId] || a.locationId).toLowerCase();
					valB = (stageNames[b.locationId] || b.locationId).toLowerCase();
					break;
				case 'name':
					valA = a.name.toLowerCase();
					valB = b.name.toLowerCase();
					break;
				case 'contact':
					valA = (a.contactInfo || '').toLowerCase();
					valB = (b.contactInfo || '').toLowerCase();
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
	const totalPages = $derived(Math.max(1, Math.ceil(sortedHotels().length / PAGE_SIZE)));
	const paginatedHotels = $derived(
		sortedHotels().slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
	);

	$effect(() => {
		if (totalPages > 0 && currentPage >= totalPages) {
			currentPage = totalPages - 1;
		}
	});

	let editingId = $state<string | null>(null);
	let showAddForm = $state(false);
	let viewingHotel = $state<{
		id: string;
		locationId: string;
		name: string;
		contactInfo: string | null;
	} | null>(null);

	const startEdit = (hotel: {
		id: string;
		locationId: string;
		name: string;
		contactInfo: string | null;
	}) => {
		editingId = hotel.id;
		showAddForm = true;
	};

	const cancelEdit = () => {
		editingId = null;
		showAddForm = false;
	};

	const viewHotel = (hotel: {
		id: string;
		locationId: string;
		name: string;
		contactInfo: string | null;
	}) => {
		viewingHotel = hotel;
	};

	const closeView = () => {
		viewingHotel = null;
	};
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
				placeholder={t.hotels_table_search_placeholder}
				bind:value={search}
			/>
		</div>
		<div class="filter-group-inline">
			<select class="filter-select" bind:value={locationFilter}>
				<option value="">{t.hotels_table_all_locations ?? 'All Locations'}</option>
				{#each STAGES as stage}
					<option value={stage.id}>{stage.name}</option>
				{/each}
			</select>
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
					{t.hotels_table_add}
				</button>
			{/if}
		</div>
	</div>

	{#if showAddForm}
		<div class="add-form">
			<h4>{editingId ? t.hotels_table_edit_hotel : t.hotels_table_add_new_hotel}</h4>
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
							<label>{t.hotels_table_location}</label>
							<select name="locationId" required disabled={!!editingId}>
								<option value="">{t.hotels_table_select_location}</option>
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
							<label>{t.hotels_table_name}</label>
							<input type="text" name="name" required value={hotel?.name || ''} />
						</div>
						<div class="form-group">
							<label>{t.hotels_table_contact}</label>
							<textarea name="contactInfo" rows="2">{hotel?.contactInfo || ''}</textarea>
						</div>
					</div>
				{:else}
					<div class="form-row">
						<div class="form-group">
							<label>{t.hotels_table_location}</label>
							<select name="locationId" required>
								<option value="">{t.hotels_table_select_location}</option>
								{#each STAGES as stage}
									<option value={stage.id}>{stage.name} ({stage.id})</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label>{t.hotels_table_name}</label>
							<input type="text" name="name" required />
						</div>
						<div class="form-group">
							<label>{t.hotels_table_contact}</label>
							<textarea name="contactInfo" rows="2"></textarea>
						</div>
					</div>
				{/if}
				<div class="form-actions">
					<button type="submit" class="btn-submit"
						>{editingId ? t.hotels_table_update : t.hotels_table_create}</button
					>
					<button type="button" class="btn-cancel" onclick={cancelEdit}
						>{t.bookings_table_cancel}</button
					>
				</div>
			</form>
		</div>
	{/if}

	{#if hotels.length === 0}
		<p class="empty-state">{t.hotels_table_empty}</p>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					<th class="sortable" onclick={() => handleSort('location')}>
						<div class="th-content">
							{t.hotels_table_location}
							{#if sortColumn === 'location'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('name')}>
						<div class="th-content">
							{t.hotels_modal_name}
							{#if sortColumn === 'name'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th class="sortable" onclick={() => handleSort('contact')}>
						<div class="th-content">
							{t.hotels_table_contact}
							{#if sortColumn === 'contact'}
								<span class="sort-indicator">{sortDirection === 'asc' ? '↑' : '↓'}</span>
							{/if}
						</div>
					</th>
					<th>{t.hotels_table_actions}</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedHotels as hotel}
					<tr>
						<td>{stageNames[hotel.locationId] || hotel.locationId}</td>
						<td>{hotel.name}</td>
						<td>{hotel.contactInfo || '—'}</td>
						<td class="actions">
							<div class="actions-wrapper">
								<button
									type="button"
									class="action-btn"
									onclick={() => viewHotel(hotel)}
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
									onclick={() => startEdit(hotel)}
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
									action="?/deleteHotel"
									class="inline-form"
									style="display: inline-flex;"
								>
									<input type="hidden" name="hotelId" value={hotel.id} />
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
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if hotels.length > PAGE_SIZE}
			<div class="pagination-container">
				<span class="pagination-info">
					{t.bookings_table_showing
						?.replace('{start}', String(currentPage * PAGE_SIZE + 1))
						.replace('{end}', String(Math.min((currentPage + 1) * PAGE_SIZE, hotels.length)))
						.replace('{total}', String(hotels.length)) ??
						`Showing ${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, hotels.length)} of ${hotels.length}`}
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

{#if viewingHotel}
	<ViewModal title={t.hotels_modal_title} isOpen={!!viewingHotel} onClose={closeView}>
		<div class="view-details">
			<div class="detail-row">
				<strong>{t.bookings_table_id}:</strong>
				<span>{viewingHotel.id}</span>
			</div>
			<div class="detail-row">
				<strong>{t.hotels_table_location}:</strong>
				<span>{stageNames[viewingHotel.locationId] || viewingHotel.locationId}</span>
			</div>
			<div class="detail-row">
				<strong>{t.hotels_modal_name}:</strong>
				<span>{viewingHotel.name}</span>
			</div>
			<div class="detail-row">
				<strong>{t.hotels_table_contact}:</strong>
				<span>{viewingHotel.contactInfo || '—'}</span>
			</div>
		</div>
	</ViewModal>
{/if}

<style>
	.table-container {
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

	.filter-select {
		padding: 0.625rem 2.5rem 0.625rem 0.875rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.9375rem;
		background: #ffffff;
		color: var(--color-text, #333333);
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--color-accent, #c4a77d);
		box-shadow: 0 0 0 4px rgba(196, 167, 125, 0.1);
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
		display: grid;
		grid-template-columns: repeat(3, 1fr);
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
		color: var(--color-text, #333333);
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border, #e0e0e0);
		border-radius: 6px;
		font-size: 0.9rem;
		font-family: inherit;
		background: white;
		transition: all 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-accent, #c4a77d);
		box-shadow: 0 0 0 3px rgba(196, 167, 125, 0.1);
	}

	.form-group select:disabled {
		background: var(--color-secondary, #f5f5f0);
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
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
	}

	.data-table thead {
		background: var(--color-secondary, #f5f5f0);
	}

	.data-table th {
		padding: 0.75rem 1rem;
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
		padding: 0.75rem 1rem;
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

		.form-row {
			grid-template-columns: 1fr;
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

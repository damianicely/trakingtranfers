<script lang="ts">
	import ViewModal from './ViewModal.svelte';

	let { drivers, form } = $props<{
		drivers: Array<{
			id: string;
			username: string;
			role: string;
			licenseNumber: string | null;
			vehicleType: string | null;
		}>;
		form?: { success?: boolean; message?: string };
	}>();

	let editingId = $state<string | null>(null);
	let viewingDriver = $state<any | null>(null);

	const startEdit = (driver: any) => {
		editingId = driver.id;
	};

	const cancelEdit = () => {
		editingId = null;
	};

	const viewDriver = (driver: any) => {
		viewingDriver = driver;
	};

	const closeView = () => {
		viewingDriver = null;
	};
</script>

{#if form?.success}
	<div class="success-message">{form.message || 'Operation successful'}</div>
{/if}

{#if form?.message && !form?.success}
	<div class="error-message">{form.message}</div>
{/if}

<div class="table-container">
	{#if drivers.length === 0}
		<p class="empty-state">No drivers found.</p>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Username</th>
					<th>License Number</th>
					<th>Vehicle Type</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each drivers as driver}
					<tr>
						<td class="mono">{driver.id.slice(0, 8)}...</td>
						<td>
							{#if editingId === driver.id}
								<form method="POST" action="?/updateDriver" class="inline-form">
									<input type="hidden" name="driverId" value={driver.id} />
									<input
										type="text"
										name="username"
										value={driver.username}
										required
										class="edit-input"
									/>
									<input
										type="text"
										name="licenseNumber"
										value={driver.licenseNumber || ''}
										placeholder="License Number"
										class="edit-input"
									/>
									<input
										type="text"
										name="vehicleType"
										value={driver.vehicleType || ''}
										placeholder="Vehicle Type"
										class="edit-input"
									/>
									<button type="submit" class="btn-save">Save</button>
									<button type="button" class="btn-cancel" onclick={cancelEdit}>Cancel</button>
								</form>
							{:else}
								{driver.username}
							{/if}
						</td>
						<td>{driver.licenseNumber || '—'}</td>
						<td>{driver.vehicleType || '—'}</td>
						<td class="actions">
							{#if editingId !== driver.id}
								<button
									type="button"
									class="btn-icon btn-view"
									onclick={() => viewDriver(driver)}
									title="View"
								>
									👁
								</button>
								<button
									type="button"
									class="btn-icon btn-edit"
									onclick={() => startEdit(driver)}
									title="Edit"
								>
									✎
								</button>
								<form method="POST" action="?/deleteDriver" class="inline-form">
									<input type="hidden" name="driverId" value={driver.id} />
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

{#if viewingDriver}
	<ViewModal title="Driver Details" isOpen={!!viewingDriver} onClose={closeView}>
		<div class="view-details">
			<div class="detail-row">
				<strong>ID:</strong>
				<span>{viewingDriver.id}</span>
			</div>
			<div class="detail-row">
				<strong>Username:</strong>
				<span>{viewingDriver.username}</span>
			</div>
			<div class="detail-row">
				<strong>Role:</strong>
				<span>{viewingDriver.role}</span>
			</div>
			<div class="detail-row">
				<strong>License Number:</strong>
				<span>{viewingDriver.licenseNumber || '—'}</span>
			</div>
			<div class="detail-row">
				<strong>Vehicle Type:</strong>
				<span>{viewingDriver.vehicleType || '—'}</span>
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

	.actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.inline-form {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin: 0;
	}

	.edit-input {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		min-width: 120px;
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

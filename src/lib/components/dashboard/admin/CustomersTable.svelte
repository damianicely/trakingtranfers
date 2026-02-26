<script lang="ts">
	import ViewModal from './ViewModal.svelte';
	import AdminIcon from '$lib/components/admin/AdminIcon.svelte';

	let { customers, form } = $props<{
		customers: Array<{ id: string; username: string; role: string }>;
		form?: { success?: boolean; message?: string };
	}>();

	let editingId = $state<string | null>(null);
	let viewingCustomer = $state<{ id: string; username: string; role: string } | null>(null);

	let search = $state('');

	type Customer = { id: string; username: string; role: string };

	const filteredCustomers = $derived(
		((customers ?? []) as Customer[]).filter((c) => {
			const q = search.trim().toLowerCase();
			if (!q) return true;
			return (
				c.username.toLowerCase().includes(q) ||
				c.role.toLowerCase().includes(q) ||
				c.id.toLowerCase().includes(q)
			);
		})
	);

	const startEdit = (customer: { id: string; username: string }) => {
		editingId = customer.id;
	};

	const cancelEdit = () => {
		editingId = null;
	};

	const viewCustomer = (customer: { id: string; username: string; role: string }) => {
		viewingCustomer = customer;
	};

	const closeView = () => {
		viewingCustomer = null;
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
		<h3>Customers</h3>
		<div class="header-actions">
			<input
				type="search"
				class="search-input"
				placeholder="Search customers…"
				bind:value={search}
				aria-label="Search customers"
			/>
			<button type="button" class="btn-add">
				+ Customer
			</button>
		</div>
	</div>

	{#if filteredCustomers.length === 0}
		<p class="empty-state">No customers found.</p>
	{:else}
		<table class="data-table">
			<thead>
				<tr>
					<th>ID</th>
					<th>Username</th>
					<th>Role</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredCustomers as customer}
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
									<button type="submit" class="btn-save">Save</button>
									<button type="button" class="btn-cancel" onclick={cancelEdit}>Cancel</button>
								</form>
							{:else}
								{customer.username}
							{/if}
						</td>
						<td>{customer.role}</td>
						<td class="actions">
							{#if editingId !== customer.id}
								<button
									type="button"
									class="btn-icon btn-view"
									onclick={() => viewCustomer(customer)}
									title="View"
								>
									<AdminIcon name="eye" size={18} />
								</button>
								<button
									type="button"
									class="btn-icon btn-edit"
									onclick={() => startEdit(customer)}
									title="Edit"
								>
									<AdminIcon name="edit" size={18} />
								</button>
								<form method="POST" action="?/deleteCustomer" class="inline-form">
									<input type="hidden" name="customerId" value={customer.id} />
									<button type="submit" class="btn-icon btn-delete" title="Delete">
										<AdminIcon name="trash" size={18} />
									</button>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

{#if viewingCustomer}
	<ViewModal title="Customer Details" isOpen={!!viewingCustomer} onClose={closeView}>
		<div class="view-details">
			<div class="detail-row">
				<strong>ID:</strong>
				<span>{viewingCustomer.id}</span>
			</div>
			<div class="detail-row">
				<strong>Username:</strong>
				<span>{viewingCustomer.username}</span>
			</div>
			<div class="detail-row">
				<strong>Role:</strong>
				<span>{viewingCustomer.role}</span>
			</div>
		</div>
	</ViewModal>
{/if}

<style>
	.table-container {
		width: 100%;
		overflow-x: auto;
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
		gap: 0.5rem;
		align-items: center;
		margin: 0;
	}

	.edit-input {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
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

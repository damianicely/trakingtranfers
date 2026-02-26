<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';

	let { allStaff, form, useTeamLabels = false } = $props<{
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
	const addNewLabel = $derived(useTeamLabels ? (t.team_add_new ?? 'Add new team member') : t.staff_add_new);
	const emptyLabel = $derived(useTeamLabels ? (t.team_empty ?? 'No team members yet.') : t.staff_empty);
	const successLabel = $derived(useTeamLabels ? (t.team_success ?? 'Team member added') : t.staff_success);

	let showAddForm = $state(false);
</script>

{#if form?.success}
	<div class="success-message">{form.message || successLabel}</div>
{/if}
{#if form?.message && !form?.success}
	<div class="error-message">{form.message}</div>
{/if}

<div class="staff-section">
	<div class="table-header">
		<h3>{sectionTitle}</h3>
		{#if !showAddForm}
			<button type="button" class="btn-add" onclick={() => { showAddForm = true; }}>
				+ {addLabel}
			</button>
		{/if}
	</div>

	{#if showAddForm}
		<div class="add-form">
			<h4>{addNewLabel}</h4>
			<form
				method="POST"
				action="?/createStaff"
				onsubmit={() => {
					setTimeout(() => { showAddForm = false; }, 100);
				}}
			>
				<!-- When email is integrated, send automated onboarding email to this address -->
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
				</div>
				<div class="form-row driver-fields">
					<div class="form-group">
						<label for="staff-license">{t.staff_license}</label>
						<input id="staff-license" type="text" name="licenseNumber" />
						<span class="form-hint">{t.staff_license_hint}</span>
					</div>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn-submit">{addLabel}</button>
					<button type="button" class="btn-cancel" onclick={() => { showAddForm = false; }}>{t.staff_cancel}</button>
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
					<th>{t.staff_email}</th>
					<th>{t.staff_first_name}</th>
					<th>{t.staff_last_name}</th>
					<th>{t.staff_role}</th>
					<th>{t.staff_license}</th>
					<th>{t.staff_actions}</th>
				</tr>
			</thead>
			<tbody>
				{#each allStaff as staff}
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
							<form method="POST" action="?/removeStaff" class="inline-form">
								<input type="hidden" name="staffId" value={staff.id} />
								<button type="submit" class="btn-icon btn-delete" title={t.staff_remove}>×</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.staff-section {
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
	.btn-add {
		padding: 0.5rem 1rem;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 600;
	}
	.btn-add:hover {
		background: #218838;
	}
	.add-form {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}
	.add-form h4 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
	}
	.form-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.form-group {
		flex: 1;
		min-width: 140px;
	}
	.form-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		margin-bottom: 0.35rem;
	}
	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	.form-hint {
		font-size: 0.75rem;
		color: #666;
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
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	.btn-cancel {
		padding: 0.5rem 1rem;
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}
	.empty-state {
		padding: 2rem;
		text-align: center;
		color: #666;
		font-style: italic;
	}
	.data-table {
		width: 100%;
		border-collapse: collapse;
	}
	.data-table th,
	.data-table td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}
	.data-table th {
		font-weight: 600;
		background: #f8f9fa;
	}
	.role-badge {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 500;
	}
	.role-badge.role-admin {
		background: #e7f1ff;
		color: #004085;
	}
	.role-badge.role-driver {
		background: #fff3cd;
		color: #856404;
	}
	.actions .inline-form {
		display: inline;
	}
	.btn-icon.btn-delete {
		background: #dc3545;
		color: white;
		border: none;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1.2rem;
		line-height: 1;
	}
	.btn-icon.btn-delete:hover {
		background: #c82333;
	}
	.success-message {
		padding: 0.75rem;
		background: #d4edda;
		color: #155724;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	.error-message {
		padding: 0.75rem;
		background: #f8d7da;
		color: #721c24;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
</style>

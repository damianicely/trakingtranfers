<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import BookingsTable from '$lib/components/dashboard/admin/BookingsTable.svelte';

	let { data, form } = $props();

	const t = $derived(translations[$language]);
	const allBookings = $derived((data.allBookings ?? []) as any[]);

	let bookingsSearch = $state('');
	let statusFilter = $state('');

	const filteredBookings = $derived(
		allBookings.filter((b) => {
			const q = bookingsSearch.trim().toLowerCase();
			const matchesSearch =
				!q ||
				`${b.userFirstName ?? b.firstName ?? ''} ${b.userLastName ?? b.lastName ?? ''}`
					.toLowerCase()
					.includes(q) ||
				(b.email ?? '').toLowerCase().includes(q) ||
				(b.id ?? '').toLowerCase().includes(q);
			const matchesStatus = !statusFilter || b.status === statusFilter;
			return matchesSearch && matchesStatus;
		})
	);
</script>

<div class="admin-sales">
	<!-- Page Header -->
	<div class="page-header">
		<h1 class="page-title">{t.admin_nav_sales}</h1>
	</div>

	<!-- Table Container -->
	<div class="data-table-container">
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
					placeholder={t.team_search_placeholder ?? 'Search bookings...'}
					bind:value={bookingsSearch}
				/>
			</div>
			<div class="filter-group-inline">
				<select class="filter-select" bind:value={statusFilter}>
					<option value="">{t.bookings_status_all ?? 'All Status'}</option>
					<option value="paid">{t.bookings_status_paid ?? 'Paid'}</option>
					<option value="pending">{t.bookings_status_pending ?? 'Pending'}</option>
					<option value="cancelled">{t.bookings_status_cancelled ?? 'Cancelled'}</option>
				</select>
				<button class="btn btn-secondary" type="button">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7 10 12 15 17 10"></polyline>
						<line x1="12" y1="15" x2="12" y2="3"></line>
					</svg>
					{t.dashboard_export_csv ?? 'Export CSV'}
				</button>
				<a href="/" class="btn btn-primary">
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
					{t.dashboard_section_bookings_create_link ?? 'Add booking'}
				</a>
			</div>
		</div>

		<BookingsTable bookings={filteredBookings} {form} />
	</div>
</div>

<style>
	.admin-sales {
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

	.data-table-container {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

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

	.btn-secondary {
		background: #ffffff;
		color: var(--color-text, #333333);
		border: 1px solid var(--color-border, #e0e0e0);
	}

	.btn-secondary:hover {
		background: var(--color-secondary, #f5f5f0);
		border-color: var(--color-text-light, #666666);
	}

	@media (max-width: 768px) {
		.data-table-header {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			min-width: auto;
		}

		.filter-group-inline {
			width: 100%;
		}

		.filter-select,
		.btn {
			flex: 1;
		}
	}
</style>

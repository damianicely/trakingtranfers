<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import BookingsTable from '$lib/components/dashboard/admin/BookingsTable.svelte';

	let { data, form } = $props();

	const t = $derived(translations[$language]);
	const allBookings = $derived((data.allBookings ?? []) as any[]);

	let bookingsSearch = $state('');
	const filteredBookings = $derived(
		allBookings.filter((b) => {
			const q = bookingsSearch.trim().toLowerCase();
			if (!q) return true;
			const name =
				`${(b.userFirstName ?? b.firstName) ?? ''} ${(b.userLastName ?? b.lastName) ?? ''}`.toLowerCase();
			const email = (b.email ?? '').toLowerCase();
			const id = (b.id ?? '').toLowerCase();
			return name.includes(q) || email.includes(q) || id.includes(q);
		})
	);
</script>

<div class="admin-sales">
	<div class="table-wrapper bookings-section-wrapper">
		<div class="table-header">
			<h3>{t.admin_nav_sales}</h3>
			<div class="header-actions">
				<input
					type="search"
					class="search-input"
					placeholder={t.team_search_placeholder ?? 'Search…'}
					bind:value={bookingsSearch}
					aria-label="Search bookings"
				/>
				<a href="/" class="btn-add">+ {t.dashboard_section_bookings_create_link ?? 'Add booking'}</a>
			</div>
		</div>
		<BookingsTable bookings={filteredBookings} {form} />
	</div>
</div>

<style>
	.admin-sales {
		max-width: 960px;
		margin: 0 auto;
	}

	.table-wrapper {
		background: #fff;
		border-radius: 10px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid rgba(0, 0, 0, 0.04);
		overflow: hidden;
	}

	.bookings-section-wrapper {
		padding: 1.5rem;
	}

	.bookings-section-wrapper :global(.table-container) {
		margin-top: 0;
	}

	.table-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.table-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1d21;
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
		background: #1a1d21;
		color: #fff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		font-size: 0.9375rem;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}

	.btn-add:hover {
		background: #2d3238;
		color: #fff;
	}
</style>

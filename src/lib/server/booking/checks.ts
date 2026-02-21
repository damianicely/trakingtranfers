import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { userTable, bookingTable, bookingSegmentTable } from '$lib/server/db/schema';
import { eq, and, inArray, gte, lte } from 'drizzle-orm';

/** Message shown when email is already registered. Single source of truth for API and createCheckout. */
export const EMAIL_ALREADY_REGISTERED_MESSAGE =
	'An account with this email is already registered.';

/** Message shown when selected dates exceed daily transfer capacity. */
export const DATES_FULLY_BOOKED_MESSAGE =
	'The selected dates are fully booked. Please choose different dates.';

export type CheckResult = { ok: true } | { ok: false; message: string };

/**
 * Check if a user with the given email (username) already exists.
 * Normalizes email (trim, toLowerCase). Does not leak the email in the response.
 */
export async function checkEmailExists(email: string): Promise<CheckResult> {
	const normalized = (email || '').toString().trim().toLowerCase();
	if (!normalized) {
		return { ok: false, message: 'Email is required.' };
	}

	const existing = await db
		.select({ id: userTable.id })
		.from(userTable)
		.where(eq(userTable.username, normalized))
		.limit(1);

	if (existing.length > 0) {
		return { ok: false, message: EMAIL_ALREADY_REGISTERED_MESSAGE };
	}
	return { ok: true };
}

/**
 * Compute proposed segment counts per calendar date for a route starting on departureDate.
 * Returns a Record<dateStr, count> where dateStr is YYYY-MM-DD.
 */
function proposedCountsByDate(
	departureDateStr: string,
	route: [string, string][]
): Record<string, number> {
	const counts: Record<string, number> = {};
	if (!route || route.length === 0) return counts;

	const base = new Date(departureDateStr);
	if (isNaN(base.getTime())) return counts;

	for (let i = 0; i < route.length; i++) {
		const d = new Date(base);
		d.setDate(d.getDate() + i);
		const dateStr = d.toISOString().split('T')[0];
		counts[dateStr] = (counts[dateStr] ?? 0) + 1;
	}
	return counts;
}

/**
 * Check if adding this booking would exceed the daily transfer limit on any date.
 * Uses MAX_TRANSFERS_PER_DAY from env. If unset, returns { ok: true } (no limit).
 */
export async function checkDailyCapacity(
	departureDateStr: string,
	route: [string, string][] | null
): Promise<CheckResult> {
	const maxPerDay = env.MAX_TRANSFERS_PER_DAY;
	const limit = maxPerDay ? parseInt(maxPerDay, 10) : 0;
	if (!limit || isNaN(limit) || limit <= 0) {
		return { ok: true };
	}

	if (!departureDateStr || !route || route.length === 0) {
		return { ok: true };
	}

	const proposed = proposedCountsByDate(departureDateStr, route);
	const dateStrs = Object.keys(proposed);
	if (dateStrs.length === 0) return { ok: true };

	const minDate = new Date(dateStrs[0]!);
	const maxDate = new Date(dateStrs[dateStrs.length - 1]!);
	minDate.setHours(0, 0, 0, 0);
	maxDate.setHours(23, 59, 59, 999);

	// Fetch all segments in this date range for pending/paid bookings
	const segments = await db
		.select({
			travelDate: bookingSegmentTable.travelDate
		})
		.from(bookingSegmentTable)
		.innerJoin(bookingTable, eq(bookingSegmentTable.bookingId, bookingTable.id))
		.where(
			and(
				inArray(bookingTable.status, ['pending', 'paid']),
				gte(bookingSegmentTable.travelDate, minDate),
				lte(bookingSegmentTable.travelDate, maxDate)
			)
		);

	// Count existing segments per date (date-only key)
	const existingByDate: Record<string, number> = {};
	for (const row of segments) {
		const d = row.travelDate;
		if (!d) continue;
		const dateStr = new Date(d).toISOString().split('T')[0];
		existingByDate[dateStr] = (existingByDate[dateStr] ?? 0) + 1;
	}

	for (const dateStr of dateStrs) {
		const existing = existingByDate[dateStr] ?? 0;
		const proposedCount = proposed[dateStr] ?? 0;
		if (existing + proposedCount > limit) {
			return { ok: false, message: DATES_FULLY_BOOKED_MESSAGE };
		}
	}

	return { ok: true };
}

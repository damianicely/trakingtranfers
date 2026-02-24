import { db } from '$lib/server/db';
import { bookingTable, bookingSegmentTable, driverStepAssignmentTable } from '$lib/server/db/schema';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';

/** Returns set of date strings (YYYY-MM-DD) that have at least one segment for pending/paid bookings in the range. */
export async function getDatesWithActiveJourneys(
	startDateStr: string,
	endDateStr: string
): Promise<Set<string>> {
	const start = new Date(startDateStr);
	const end = new Date(endDateStr);
	start.setHours(0, 0, 0, 0);
	end.setHours(23, 59, 59, 999);

	const rows = await db
		.select({ travelDate: bookingSegmentTable.travelDate })
		.from(bookingSegmentTable)
		.innerJoin(bookingTable, eq(bookingSegmentTable.bookingId, bookingTable.id))
		.where(
			and(
				inArray(bookingTable.status, ['pending', 'paid']),
				gte(bookingSegmentTable.travelDate, start),
				lte(bookingSegmentTable.travelDate, end)
			)
		);

	const set = new Set<string>();
	for (const row of rows) {
		if (row.travelDate) {
			const d = new Date(row.travelDate);
			set.add(d.toISOString().split('T')[0]!);
		}
	}
	return set;
}

/** Returns for each date in range the set of step keys "fromId-toId" that have a booking segment (pending/paid). */
export async function getBookedStepKeysByDateInRange(
	startDateStr: string,
	endDateStr: string
): Promise<Record<string, Set<string>>> {
	const start = new Date(startDateStr);
	const end = new Date(endDateStr);
	start.setHours(0, 0, 0, 0);
	end.setHours(23, 59, 59, 999);

	const rows = await db
		.select({
			travelDate: bookingSegmentTable.travelDate,
			fromStageId: bookingSegmentTable.fromStageId,
			toStageId: bookingSegmentTable.toStageId
		})
		.from(bookingSegmentTable)
		.innerJoin(bookingTable, eq(bookingSegmentTable.bookingId, bookingTable.id))
		.where(
			and(
				inArray(bookingTable.status, ['pending', 'paid']),
				gte(bookingSegmentTable.travelDate, start),
				lte(bookingSegmentTable.travelDate, end)
			)
		);

	const byDate: Record<string, Set<string>> = {};
	for (const row of rows) {
		if (!row.travelDate) continue;
		const dateStr = new Date(row.travelDate).toISOString().split('T')[0]!;
		if (!byDate[dateStr]) byDate[dateStr] = new Set();
		byDate[dateStr].add(`${row.fromStageId}-${row.toStageId}`);
	}
	return byDate;
}

/** Returns for each date in range the set of step keys "fromId-toId" that have a driver assignment. */
export async function getAssignedStepKeysByDateInRange(
	startDateStr: string,
	endDateStr: string
): Promise<Record<string, Set<string>>> {
	const rows = await db
		.select({
			date: driverStepAssignmentTable.date,
			fromStageId: driverStepAssignmentTable.fromStageId,
			toStageId: driverStepAssignmentTable.toStageId
		})
		.from(driverStepAssignmentTable)
		.where(
			and(
				gte(driverStepAssignmentTable.date, startDateStr),
				lte(driverStepAssignmentTable.date, endDateStr)
			)
		);

	const byDate: Record<string, Set<string>> = {};
	for (const row of rows) {
		if (!row.date) continue;
		if (!byDate[row.date]) byDate[row.date] = new Set();
		byDate[row.date].add(`${row.fromStageId}-${row.toStageId}`);
	}
	return byDate;
}

export type DaySummary = {
	date: string; // YYYY-MM-DD
	hasActiveJourneys: boolean;
	hasDriverAssignments: boolean; // true only when all booked legs that day have a driver
};

/** Returns calendar summary for every day in the given month (YYYY-MM). Green only when all booked legs have a driver. */
export async function getCalendarSummaryForMonth(yearMonth: string): Promise<DaySummary[]> {
	const [y, m] = yearMonth.split('-').map(Number);
	if (!y || !m) return [];
	const start = new Date(y, m - 1, 1);
	const end = new Date(y, m, 0);
	const startStr = start.toISOString().split('T')[0]!;
	const endStr = end.toISOString().split('T')[0]!;

	const [journeyDates, bookedByDate, assignedByDate] = await Promise.all([
		getDatesWithActiveJourneys(startStr, endStr),
		getBookedStepKeysByDateInRange(startStr, endStr),
		getAssignedStepKeysByDateInRange(startStr, endStr)
	]);

	const days: DaySummary[] = [];
	const lastDay = end.getDate();
	for (let d = 1; d <= lastDay; d++) {
		const date = new Date(y, m - 1, d);
		const dateStr = date.toISOString().split('T')[0]!;
		const booked = bookedByDate[dateStr];
		const assigned = assignedByDate[dateStr] ?? new Set();
		const hasActiveJourneys = journeyDates.has(dateStr);
		const hasDriverAssignments =
			hasActiveJourneys &&
			!!booked &&
			booked.size > 0 &&
			[...booked].every((key) => assigned.has(key));
		days.push({
			date: dateStr,
			hasActiveJourneys,
			hasDriverAssignments
		});
	}
	return days;
}

/**
 * Steps (from_stage_id, to_stage_id) that have at least one booking segment on the given date
 * for pending/paid bookings. Used to show only booked legs in the admin day-detail view.
 * Called on every admin calendar day view; see CONTRIBUTIONS_AI.md "Frequently called logic".
 */
export async function getStepsWithBookingsOnDate(
	dateStr: string
): Promise<Array<[string, string]>> {
	const start = new Date(dateStr);
	const end = new Date(dateStr);
	start.setHours(0, 0, 0, 0);
	end.setHours(23, 59, 59, 999);

	const rows = await db
		.select({
			fromStageId: bookingSegmentTable.fromStageId,
			toStageId: bookingSegmentTable.toStageId
		})
		.from(bookingSegmentTable)
		.innerJoin(bookingTable, eq(bookingSegmentTable.bookingId, bookingTable.id))
		.where(
			and(
				inArray(bookingTable.status, ['pending', 'paid']),
				gte(bookingSegmentTable.travelDate, start),
				lte(bookingSegmentTable.travelDate, end)
			)
		);

	const seen = new Set<string>();
	const steps: Array<[string, string]> = [];
	for (const row of rows) {
		const key = `${row.fromStageId}-${row.toStageId}`;
		if (seen.has(key)) continue;
		seen.add(key);
		steps.push([row.fromStageId, row.toStageId]);
	}
	return steps;
}

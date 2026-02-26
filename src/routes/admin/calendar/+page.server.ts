import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import {
	getCalendarSummaryForMonth,
	getStepsWithBookingsOnDate,
	getLegSummariesForDate
} from '$lib/server/driver-assignment/calendar-summary';
import { getAssignmentsForDate, setAssignment, removeAssignment } from '$lib/server/driver-assignment/assignments';
import { db } from '$lib/server/db';
import { bookingTable, userTable } from '$lib/server/db/schema';

function getDefaultYearMonth(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDefaultDateStr(): string {
	return new Date().toISOString().split('T')[0]!;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;

	const calendarMonth = url.searchParams.get('calendarMonth') ?? getDefaultYearMonth();
	const selectedDate = url.searchParams.get('selectedDate') ?? getDefaultDateStr();

	const calendarSummary = await getCalendarSummaryForMonth(calendarMonth);
	const highlightedDates = calendarSummary
		.filter((d) => d.hasActiveJourneys)
		.map((d) => d.date);

	let bookedStepsForDate: Array<[string, string]> = [];
	let legSummaries: Awaited<ReturnType<typeof getLegSummariesForDate>> = [];
	let drivers: Array<{ id: string; username: string; firstName: string | null; lastName: string | null }> = [];
	let driverAssignments: Record<string, string[]> = {};

	let bookingDetailsById: Record<
		string,
		{
			id: string;
			userId: string | null;
			status: string | null;
			firstName: string | null;
			lastName: string | null;
			userFirstName: string | null;
			userLastName: string | null;
			email: string | null;
			phone: string | null;
			departureDate: Date | null;
			departureStageId: string | null;
			destinationStageId: string | null;
			totalPrice: string | null;
			createdAt: Date | null;
		}
	> = {};

	if (user.role === 'admin' || user.role === 'owner') {
		[bookedStepsForDate, legSummaries, drivers, driverAssignments] = await Promise.all([
			getStepsWithBookingsOnDate(selectedDate),
			getLegSummariesForDate(selectedDate),
			db
				.select({ id: userTable.id, username: userTable.username, firstName: userTable.firstName, lastName: userTable.lastName })
				.from(userTable)
				.where(eq(userTable.role, 'driver'))
				.orderBy(userTable.username),
			getAssignmentsForDate(selectedDate)
		]);

		const bookingIds = [...new Set((legSummaries ?? []).map((s) => s.bookingId))];
		if (bookingIds.length > 0) {
			const rawBookings = await db.select().from(bookingTable).where(inArray(bookingTable.id, bookingIds));
			const userIds = [...new Set(rawBookings.map((b) => b.userId).filter(Boolean) as string[])];
			let userMap: Record<string, { firstName: string | null; lastName: string | null }> = {};
			if (userIds.length > 0) {
				const users = await db
					.select({ id: userTable.id, firstName: userTable.firstName, lastName: userTable.lastName })
					.from(userTable)
					.where(inArray(userTable.id, userIds));
				userMap = Object.fromEntries(users.map((u) => [u.id, u]));
			}
			for (const b of rawBookings) {
				bookingDetailsById[b.id] = {
					id: b.id,
					userId: b.userId,
					status: b.status,
					firstName: b.firstName,
					lastName: b.lastName,
					userFirstName: (b.userId ? userMap[b.userId]?.firstName ?? null : null) as string | null,
					userLastName: (b.userId ? userMap[b.userId]?.lastName ?? null : null) as string | null,
					email: b.email,
					phone: b.phone,
					departureDate: b.departureDate,
					departureStageId: b.departureStageId,
					destinationStageId: b.destinationStageId,
					totalPrice: b.totalPrice,
					createdAt: b.createdAt
				};
			}
		}
	}

	return {
		user,
		calendarMonth,
		selectedDate,
		highlightedDates,
		bookedStepsForDate,
		legSummaries,
		drivers,
		driverAssignments,
		bookingDetailsById
	};
};

export const actions: Actions = {
	toggleDriver: async ({ request, locals }) => {
		const user = locals.user;
		if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
			return fail(403, { message: 'Forbidden' });
		}
		const data = await request.formData();
		const selectedDate = data.get('selectedDate');
		const fromStageId = data.get('fromStageId');
		const toStageId = data.get('toStageId');
		const driverId = data.get('driverId');
		const assigned = data.get('assigned') === '1';
		if (
			typeof selectedDate !== 'string' ||
			typeof fromStageId !== 'string' ||
			typeof toStageId !== 'string' ||
			typeof driverId !== 'string'
		) {
			return fail(400, { message: 'Missing parameters' });
		}
		if (assigned) {
			await setAssignment(selectedDate, fromStageId, toStageId, driverId);
		} else {
			await removeAssignment(selectedDate, fromStageId, toStageId, driverId);
		}
		return { success: true };
	}
};


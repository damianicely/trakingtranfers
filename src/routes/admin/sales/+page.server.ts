import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookingTable, bookingSegmentTable, userTable } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

async function attachUserNamesToBookings<T extends { userId?: string | null }>(
	bookings: T[]
): Promise<(T & { userFirstName: string | null; userLastName: string | null })[]> {
	const userIds = [...new Set(bookings.map((b) => b.userId).filter(Boolean) as string[])];
	if (userIds.length === 0) {
		return bookings.map((b) => ({ ...b, userFirstName: null, userLastName: null }));
	}
	const users = await db
		.select({ id: userTable.id, firstName: userTable.firstName, lastName: userTable.lastName })
		.from(userTable)
		.where(inArray(userTable.id, userIds));
	const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
	return bookings.map((b) => ({
		...b,
		userFirstName: (b.userId ? userMap[b.userId]?.firstName ?? null : null) as string | null,
		userLastName: (b.userId ? userMap[b.userId]?.lastName ?? null : null) as string | null
	}));
}

function canPerformAdminActions(user: { role: string } | null): boolean {
	return !!user && (user.role === 'admin' || user.role === 'owner');
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	let allBookings: any[] = [];

	if (user.role === 'admin' || user.role === 'owner') {
		const rawAllBookings = await db
			.select()
			.from(bookingTable)
			.orderBy(desc(bookingTable.createdAt));
		allBookings = await attachUserNamesToBookings(rawAllBookings);
	}

	return {
		user,
		allBookings
	};
};

export const actions: Actions = {
	updateBooking: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const bookingId = formData.get('bookingId')?.toString();
		const status = formData.get('status')?.toString();
		if (!bookingId || !status) {
			return fail(400, { message: 'Booking ID and status are required' });
		}
		await db
			.update(bookingTable)
			.set({ status, updatedAt: new Date() })
			.where(eq(bookingTable.id, bookingId));
		return { success: true, message: 'Booking updated successfully' };
	},
	deleteBooking: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const bookingId = formData.get('bookingId')?.toString();
		if (!bookingId) {
			return fail(400, { message: 'Booking ID is required' });
		}
		await db.delete(bookingSegmentTable).where(eq(bookingSegmentTable.bookingId, bookingId));
		await db.delete(bookingTable).where(eq(bookingTable.id, bookingId));
		return { success: true, message: 'Booking deleted successfully' };
	}
};

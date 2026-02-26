import { db } from '$lib/server/db';
import { bookingTable, userTable } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

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

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	let ownerBookings: any[] = [];
	let dailySales: Array<{ date: string; amount: number; count: number }> = [];

	if (user.role === 'owner') {
		const rawOwnerBookings = await db
			.select()
			.from(bookingTable)
			.where(eq(bookingTable.status, 'paid'))
			.orderBy(desc(bookingTable.createdAt))
			.limit(100);
		ownerBookings = await attachUserNamesToBookings(rawOwnerBookings);

		const salesByDate: Record<string, { amount: number; count: number }> = {};
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 29; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];
			salesByDate[dateStr!] = { amount: 0, count: 0 };
		}

		for (const booking of ownerBookings) {
			if (booking.createdAt && booking.totalPrice) {
				const bookingDate = new Date(booking.createdAt);
				bookingDate.setHours(0, 0, 0, 0);
				const dateStr = bookingDate.toISOString().split('T')[0];
				if (dateStr && salesByDate[dateStr]) {
					salesByDate[dateStr].amount += parseFloat(booking.totalPrice) || 0;
					salesByDate[dateStr].count += 1;
				}
			}
		}

		dailySales = Object.entries(salesByDate)
			.map(([date, data]) => ({ date, ...data }))
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	return {
		user,
		ownerBookings,
		dailySales
	};
};

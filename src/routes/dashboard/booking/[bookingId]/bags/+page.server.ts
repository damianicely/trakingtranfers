import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bagTable, bookingTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'admin' && locals.user.role !== 'owner') {
		throw redirect(302, '/dashboard');
	}

	const bookingId = params.bookingId;
	const [booking] = await db
		.select({
			id: bookingTable.id,
			status: bookingTable.status,
			departureDate: bookingTable.departureDate,
			departureStageId: bookingTable.departureStageId,
			destinationStageId: bookingTable.destinationStageId
		})
		.from(bookingTable)
		.where(eq(bookingTable.id, bookingId))
		.limit(1);

	if (!booking) throw redirect(302, '/dashboard');

	const bags = await db
		.select({ id: bagTable.id, label: bagTable.label })
		.from(bagTable)
		.where(eq(bagTable.bookingId, bookingId));

	const origin = url.origin;
	const bagsWithUrls = bags.map((b) => ({
		id: b.id,
		label: b.label,
		driverUrl: `${origin}/driver/bag/${b.id}`
	}));

	return {
		booking: {
			id: booking.id,
			shortRef: booking.id.slice(0, 8),
			status: booking.status,
			departureDate: booking.departureDate,
			departureStageId: booking.departureStageId,
			destinationStageId: booking.destinationStageId
		},
		bags: bagsWithUrls
	};
};

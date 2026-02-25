import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	bagTable,
	bagLegTable,
	bookingTable,
	bookingSegmentTable,
	hotelTable,
	driverStepAssignmentTable
} from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

function toDateOnlyString(d: Date | null | undefined): string {
	if (!d) return '';
	const copy = new Date(d);
	copy.setHours(0, 0, 0, 0);
	return copy.toISOString().split('T')[0]!;
}

async function loadBagAndLegs(bagId: string) {
	const [bag] = await db
		.select({
			id: bagTable.id,
			label: bagTable.label,
			bookingId: bagTable.bookingId
		})
		.from(bagTable)
		.where(eq(bagTable.id, bagId))
		.limit(1);

	if (!bag) {
		return null;
	}

	const [booking] = await db
		.select({
			id: bookingTable.id,
			status: bookingTable.status
		})
		.from(bookingTable)
		.where(eq(bookingTable.id, bag.bookingId))
		.limit(1);

	if (!booking || booking.status !== 'paid') {
		return null;
	}

	const rows = await db
		.select({
			segmentId: bookingSegmentTable.id,
			segmentIndex: bookingSegmentTable.segmentIndex,
			travelDate: bookingSegmentTable.travelDate,
			fromStageId: bookingSegmentTable.fromStageId,
			toStageId: bookingSegmentTable.toStageId,
			startHotelName: hotelTable.name,
			endHotelName: hotelTable.name,
			status: bagLegTable.status,
			pickedUpAt: bagLegTable.pickedUpAt,
			deliveredAt: bagLegTable.deliveredAt
		})
		.from(bookingSegmentTable)
		.leftJoin(
			bagLegTable,
			and(eq(bagLegTable.segmentId, bookingSegmentTable.id), eq(bagLegTable.bagId, bag.id))
		)
		.leftJoin(hotelTable, eq(bookingSegmentTable.startHotelId, hotelTable.id))
		.where(eq(bookingSegmentTable.bookingId, bag.bookingId));

	const segments = rows
		.map((r) => ({
			segmentId: r.segmentId,
			segmentIndex: parseInt(r.segmentIndex ?? '0', 10) || 0,
			travelDate: r.travelDate,
			fromStageId: r.fromStageId,
			toStageId: r.toStageId,
			startHotelName: r.startHotelName ?? 'Start hotel not set',
			endHotelName: r.endHotelName ?? 'End hotel not set',
			status: (r.status ?? 'at_hotel') as 'at_hotel' | 'with_driver' | 'delivered',
			pickedUpAt: r.pickedUpAt,
			deliveredAt: r.deliveredAt
		}))
		.sort((a, b) => a.segmentIndex - b.segmentIndex);

	let currentIndex = segments.findIndex((s) => s.status !== 'delivered');
	if (currentIndex === -1 && segments.length > 0) {
		currentIndex = segments.length - 1;
	}

	return {
		bag,
		booking,
		segments,
		currentIndex
	};
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	if (locals.user.role !== 'driver') {
		throw redirect(302, '/dashboard');
	}

	const bagId = params.bagId;
	const data = await loadBagAndLegs(bagId);

	if (!data) {
		throw fail(404, { message: 'Bag not found or booking not paid.' });
	}

	const bookingShortRef = data.booking.id.slice(0, 8);

	return {
		bag: {
			id: data.bag.id,
			label: data.bag.label,
			bookingId: data.bag.bookingId,
			bookingShortRef
		},
		segments: data.segments.map((s) => ({
			segmentId: s.segmentId,
			index: s.segmentIndex,
			date: toDateOnlyString(s.travelDate as Date),
			fromStageId: s.fromStageId,
			toStageId: s.toStageId,
			startHotelName: s.startHotelName,
			endHotelName: s.endHotelName,
			status: s.status,
			pickedUpAt: s.pickedUpAt,
			deliveredAt: s.deliveredAt
		})),
		currentIndex: data.currentIndex
	};
};

async function assertDriverAssignedToLeg(
	driverId: string,
	segmentId: string
): Promise<{ ok: boolean; message?: string }> {
	const [seg] = await db
		.select({
			travelDate: bookingSegmentTable.travelDate,
			fromStageId: bookingSegmentTable.fromStageId,
			toStageId: bookingSegmentTable.toStageId
		})
		.from(bookingSegmentTable)
		.where(eq(bookingSegmentTable.id, segmentId))
		.limit(1);

	if (!seg || !seg.travelDate) {
		return { ok: false, message: 'Segment not found.' };
	}

	const dateStr = toDateOnlyString(seg.travelDate as Date);

	const rows = await db
		.select({ id: driverStepAssignmentTable.id })
		.from(driverStepAssignmentTable)
		.where(
			and(
				eq(driverStepAssignmentTable.date, dateStr),
				eq(driverStepAssignmentTable.fromStageId, seg.fromStageId),
				eq(driverStepAssignmentTable.toStageId, seg.toStageId),
				eq(driverStepAssignmentTable.driverId, driverId)
			)
		)
		.limit(1);

	if (rows.length === 0) {
		return { ok: false, message: 'You are not assigned to this step on this date.' };
	}

	return { ok: true };
}

export const actions: Actions = {
	pickUp: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'driver') {
			throw redirect(302, '/login');
		}
		const form = await request.formData();
		const bagId = form.get('bagId')?.toString() ?? '';
		const segmentId = form.get('segmentId')?.toString() ?? '';

		if (!bagId || !segmentId) {
			return fail(400, { message: 'Missing bag or segment.' });
		}

		const data = await loadBagAndLegs(bagId);
		if (!data) return fail(404, { message: 'Bag not found.' });

		const current = data.segments[data.currentIndex];
		if (!current || current.segmentId !== segmentId) {
			return fail(400, { message: 'Can only pick up the current leg.' });
		}

		if (current.status !== 'at_hotel') {
			return fail(400, { message: 'Bag is not at hotel for this leg.' });
		}

		const assignCheck = await assertDriverAssignedToLeg(locals.user.id, segmentId);
		if (!assignCheck.ok) {
			return fail(403, { message: assignCheck.message });
		}

		await db
			.update(bagLegTable)
			.set({ status: 'with_driver', pickedUpAt: new Date() })
			.where(and(eq(bagLegTable.bagId, bagId), eq(bagLegTable.segmentId, segmentId)));

		return { success: true };
	},

	deliver: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'driver') {
			throw redirect(302, '/login');
		}
		const form = await request.formData();
		const bagId = form.get('bagId')?.toString() ?? '';
		const segmentId = form.get('segmentId')?.toString() ?? '';

		if (!bagId || !segmentId) {
			return fail(400, { message: 'Missing bag or segment.' });
		}

		const data = await loadBagAndLegs(bagId);
		if (!data) return fail(404, { message: 'Bag not found.' });

		const current = data.segments[data.currentIndex];
		if (!current || current.segmentId !== segmentId) {
			return fail(400, { message: 'Can only deliver the current leg.' });
		}

		if (current.status !== 'with_driver') {
			return fail(400, { message: 'Bag is not with driver for this leg.' });
		}

		const assignCheck = await assertDriverAssignedToLeg(locals.user.id, segmentId);
		if (!assignCheck.ok) {
			return fail(403, { message: assignCheck.message });
		}

		await db
			.update(bagLegTable)
			.set({ status: 'delivered', deliveredAt: new Date() })
			.where(and(eq(bagLegTable.bagId, bagId), eq(bagLegTable.segmentId, segmentId)));

		return { success: true };
	}
};


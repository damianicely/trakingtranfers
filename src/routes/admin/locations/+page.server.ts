import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { hotelTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import crypto from 'node:crypto';

function canPerformAdminActions(user: { role: string } | null): boolean {
	return !!user && (user.role === 'admin' || user.role === 'owner');
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const hotels = await db.select().from(hotelTable).orderBy(hotelTable.name);
	const hotelsByLocation: Record<string, typeof hotels> = {};
	for (const hotel of hotels) {
		if (!hotelsByLocation[hotel.locationId]) {
			hotelsByLocation[hotel.locationId] = [];
		}
		hotelsByLocation[hotel.locationId].push(hotel);
	}
	return { user, hotels, hotelsByLocation };
};

export const actions: Actions = {
	createHotel: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const locationId = formData.get('locationId')?.toString();
		const name = formData.get('name')?.toString();
		const contactInfo = formData.get('contactInfo')?.toString() || null;
		if (!locationId || !name) {
			return fail(400, { message: 'Location and name are required' });
		}
		const hotelId = crypto.randomUUID();
		await db.insert(hotelTable).values({
			id: hotelId,
			locationId,
			name,
			contactInfo
		});
		return { success: true, message: 'Hotel created successfully' };
	},
	updateHotel: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const hotelId = formData.get('hotelId')?.toString();
		const name = formData.get('name')?.toString();
		const contactInfo = formData.get('contactInfo')?.toString() || null;
		if (!hotelId || !name) {
			return fail(400, { message: 'Hotel ID and name are required' });
		}
		await db
			.update(hotelTable)
			.set({
				name,
				contactInfo,
				updatedAt: new Date()
			})
			.where(eq(hotelTable.id, hotelId));
		return { success: true, message: 'Hotel updated successfully' };
	},
	deleteHotel: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const hotelId = formData.get('hotelId')?.toString();
		if (!hotelId) {
			return fail(400, { message: 'Hotel ID is required' });
		}
		await db.delete(hotelTable).where(eq(hotelTable.id, hotelId));
		return { success: true, message: 'Hotel deleted successfully' };
	}
};

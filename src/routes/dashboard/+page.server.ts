import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	bookingTable,
	bookingSegmentTable,
	hotelTable,
	userTable,
	driverProfile
} from '$lib/server/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { Actions } from './$types';
import crypto from 'node:crypto';

export const load = async ({ locals }) => {
	// 1. Check if the session exists (populated by your hook)
	if (!locals.user) {
		// 2. Redirect to login if they are a guest
		throw redirect(302, '/login');
	}

	const user = locals.user;

	// 3. Load user's bookings if customer
	let bookings = [];
	let segmentsByBooking: Record<string, any[]> = {};

	if (user.role === 'customer') {
		bookings = await db
			.select()
			.from(bookingTable)
			.where(eq(bookingTable.userId, user.id))
			.orderBy(desc(bookingTable.createdAt));

		// Load segments for all bookings
		if (bookings.length > 0) {
			const bookingIds = bookings.map((b) => b.id);
			const allSegments = await db.select().from(bookingSegmentTable);

			// Group segments by booking ID
			for (const booking of bookings) {
				segmentsByBooking[booking.id] = allSegments
					.filter((s) => s.bookingId === booking.id)
					.sort((a, b) => {
						const aIdx = parseInt(a.segmentIndex || '0', 10);
						const bIdx = parseInt(b.segmentIndex || '0', 10);
						return aIdx - bIdx;
					});
			}
		}
	}

	// 4. Load all hotels (for admin and customer dropdowns)
	const hotels = await db.select().from(hotelTable).orderBy(hotelTable.name);

	// Group hotels by location
	const hotelsByLocation: Record<string, any[]> = {};
	for (const hotel of hotels) {
		if (!hotelsByLocation[hotel.locationId]) {
			hotelsByLocation[hotel.locationId] = [];
		}
		hotelsByLocation[hotel.locationId].push(hotel);
	}

	// 5. Load admin data (all bookings, customers, drivers)
	let allBookings: any[] = [];
	let allCustomers: any[] = [];
	let allDrivers: any[] = [];

	if (user.role === 'admin') {
		// Load all bookings
		allBookings = await db
			.select()
			.from(bookingTable)
			.orderBy(desc(bookingTable.createdAt));

		// Load all customers
		allCustomers = await db
			.select()
			.from(userTable)
			.where(eq(userTable.role, 'customer'))
			.orderBy(userTable.username);

		// Load all drivers
		const driverUsers = await db
			.select()
			.from(userTable)
			.where(eq(userTable.role, 'driver'))
			.orderBy(userTable.username);

		// Load driver profiles
		const driverUserIds = driverUsers.map((u) => u.id);
		const profiles =
			driverUserIds.length > 0
				? await db.select().from(driverProfile).where(inArray(driverProfile.userId, driverUserIds))
				: [];

		// Map drivers with their profiles
		allDrivers = driverUsers.map((user) => {
			const profile = profiles.find((p) => p.userId === user.id);
			return {
				...user,
				licenseNumber: profile?.licenseNumber || null,
				vehicleType: profile?.vehicleType || null
			};
		});
	}

	// 6. If they are logged in, return data to the page
	return {
		user,
		bookings,
		segmentsByBooking,
		hotels,
		hotelsByLocation,
		// Admin data
		allBookings,
		allCustomers,
		allDrivers
	};
};

export const actions: Actions = {
	// Admin: Create hotel
	createHotel: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
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

	// Admin: Update hotel
	updateHotel: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
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

	// Admin: Delete hotel
	deleteHotel: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const hotelId = formData.get('hotelId')?.toString();

		if (!hotelId) {
			return fail(400, { message: 'Hotel ID is required' });
		}

		await db.delete(hotelTable).where(eq(hotelTable.id, hotelId));

		return { success: true, message: 'Hotel deleted successfully' };
	},

	// Customer: Update booking hotels
	updateBookingHotels: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'customer') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const bookingId = formData.get('bookingId')?.toString();

		if (!bookingId) {
			return fail(400, { message: 'Booking ID is required' });
		}

		// Verify booking belongs to user
		const [booking] = await db
			.select()
			.from(bookingTable)
			.where(and(eq(bookingTable.id, bookingId), eq(bookingTable.userId, locals.user.id)));

		if (!booking) {
			return fail(404, { message: 'Booking not found' });
		}

		// Get all segments for this booking
		const allSegments = await db
			.select()
			.from(bookingSegmentTable)
			.where(eq(bookingSegmentTable.bookingId, bookingId));

		// Sort segments by index
		const segments = allSegments.sort((a, b) => {
			const aIdx = parseInt(a.segmentIndex || '0', 10);
			const bIdx = parseInt(b.segmentIndex || '0', 10);
			return aIdx - bIdx;
		});

		// Update each segment with form data
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const startHotelId = formData.get(`segment_${segment.id}_startHotel`)?.toString() || null;
			const endHotelId = formData.get(`segment_${segment.id}_endHotel`)?.toString() || null;
			const hotelNotes = formData.get(`segment_${segment.id}_notes`)?.toString() || null;

			await db
				.update(bookingSegmentTable)
				.set({
					startHotelId: startHotelId || null,
					endHotelId: endHotelId || null,
					hotelNotes: hotelNotes || null
				})
				.where(eq(bookingSegmentTable.id, segment.id));

			// Auto-populate: if this segment has an endHotel, set it as the next segment's startHotel
			// (only if next segment doesn't already have a startHotel explicitly set in the form)
			if (endHotelId && i < segments.length - 1) {
				const nextSegment = segments[i + 1];
				const nextStartHotelId = formData.get(`segment_${nextSegment.id}_startHotel`)?.toString();

				// Only auto-populate if next segment doesn't have a startHotel in the form
				if (!nextStartHotelId) {
					await db
						.update(bookingSegmentTable)
						.set({ startHotelId: endHotelId })
						.where(eq(bookingSegmentTable.id, nextSegment.id));
				}
			}
		}

		return { success: true, message: 'Hotel information updated successfully' };
	},

	// Admin: Update booking
	updateBooking: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
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
			.set({
				status,
				updatedAt: new Date()
			})
			.where(eq(bookingTable.id, bookingId));

		return { success: true, message: 'Booking updated successfully' };
	},

	// Admin: Delete booking
	deleteBooking: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const bookingId = formData.get('bookingId')?.toString();

		if (!bookingId) {
			return fail(400, { message: 'Booking ID is required' });
		}

		// Delete segments first (foreign key constraint)
		await db.delete(bookingSegmentTable).where(eq(bookingSegmentTable.bookingId, bookingId));
		// Then delete booking
		await db.delete(bookingTable).where(eq(bookingTable.id, bookingId));

		return { success: true, message: 'Booking deleted successfully' };
	},

	// Admin: Update customer
	updateCustomer: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const customerId = formData.get('customerId')?.toString();
		const username = formData.get('username')?.toString();

		if (!customerId || !username) {
			return fail(400, { message: 'Customer ID and username are required' });
		}

		await db
			.update(userTable)
			.set({ username })
			.where(eq(userTable.id, customerId));

		return { success: true, message: 'Customer updated successfully' };
	},

	// Admin: Delete customer
	deleteCustomer: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const customerId = formData.get('customerId')?.toString();

		if (!customerId) {
			return fail(400, { message: 'Customer ID is required' });
		}

		await db.delete(userTable).where(eq(userTable.id, customerId));

		return { success: true, message: 'Customer deleted successfully' };
	},

	// Admin: Update driver
	updateDriver: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const driverId = formData.get('driverId')?.toString();
		const username = formData.get('username')?.toString();
		const licenseNumber = formData.get('licenseNumber')?.toString() || null;
		const vehicleType = formData.get('vehicleType')?.toString() || null;

		if (!driverId || !username) {
			return fail(400, { message: 'Driver ID and username are required' });
		}

		// Update user
		await db.update(userTable).set({ username }).where(eq(userTable.id, driverId));

		// Update or create driver profile
		const [existingProfile] = await db
			.select()
			.from(driverProfile)
			.where(eq(driverProfile.userId, driverId));

		if (existingProfile) {
			await db
				.update(driverProfile)
				.set({
					licenseNumber: licenseNumber || null,
					vehicleType: vehicleType || null
				})
				.where(eq(driverProfile.userId, driverId));
		} else if (licenseNumber) {
			await db.insert(driverProfile).values({
				userId: driverId,
				licenseNumber: licenseNumber,
				vehicleType: vehicleType || null
			});
		}

		return { success: true, message: 'Driver updated successfully' };
	},

	// Admin: Delete driver
	deleteDriver: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const driverId = formData.get('driverId')?.toString();

		if (!driverId) {
			return fail(400, { message: 'Driver ID is required' });
		}

		// Delete profile first (foreign key constraint)
		await db.delete(driverProfile).where(eq(driverProfile.userId, driverId));
		// Then delete user
		await db.delete(userTable).where(eq(userTable.id, driverId));

		return { success: true, message: 'Driver deleted successfully' };
	}
};
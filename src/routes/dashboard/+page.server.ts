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
import type { Actions, PageServerLoad } from './$types';
import crypto from 'node:crypto';
import {
	getCalendarSummaryForMonth,
	getStepsWithBookingsOnDate
} from '$lib/server/driver-assignment/calendar-summary';
import {
	getAssignmentsForDate,
	getAssignmentsForDriver,
	setAssignment,
	clearAssignment
} from '$lib/server/driver-assignment/assignments';
import { getAllDeliverySteps } from '$lib/delivery-steps';

function getDefaultYearMonth(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDefaultDateStr(): string {
	return new Date().toISOString().split('T')[0]!;
}

export const load: PageServerLoad = async ({ locals, url }) => {
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

	// 5. Load owner data (sales analytics)
	let ownerBookings: any[] = [];
	let dailySales: Array<{ date: string; amount: number; count: number }> = [];

	if (user.role === 'owner') {
		// Load all paid bookings for sales analytics
		ownerBookings = await db
			.select()
			.from(bookingTable)
			.where(eq(bookingTable.status, 'paid'))
			.orderBy(desc(bookingTable.createdAt))
			.limit(100);

		// Calculate daily sales for the last 30 days
		const salesByDate: Record<string, { amount: number; count: number }> = {};
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Initialize last 30 days
		for (let i = 29; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split('T')[0];
			salesByDate[dateStr] = { amount: 0, count: 0 };
		}

		// Aggregate sales by date
		for (const booking of ownerBookings) {
			if (booking.createdAt && booking.totalPrice) {
				const bookingDate = new Date(booking.createdAt);
				bookingDate.setHours(0, 0, 0, 0);
				const dateStr = bookingDate.toISOString().split('T')[0];

				if (salesByDate[dateStr]) {
					salesByDate[dateStr].amount += parseFloat(booking.totalPrice) || 0;
					salesByDate[dateStr].count += 1;
				}
			}
		}

		// Convert to array and sort by date
		dailySales = Object.entries(salesByDate)
			.map(([date, data]) => ({ date, ...data }))
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	// 6. Load admin data (all bookings, customers, drivers)
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

	// Admin: calendar summary, step assignments, and booked steps for selected date
	let calendarSummary: Array<{ date: string; hasActiveJourneys: boolean; hasDriverAssignments: boolean }> = [];
	let stepAssignments: Record<string, string> = {};
	let bookedStepsForDate: Array<[string, string]> = [];
	const calendarMonth = url.searchParams.get('calendarMonth') ?? getDefaultYearMonth();
	const selectedDate = url.searchParams.get('selectedDate') ?? getDefaultDateStr();

	if (user.role === 'admin') {
		calendarSummary = await getCalendarSummaryForMonth(calendarMonth);
		stepAssignments = await getAssignmentsForDate(selectedDate);
		bookedStepsForDate = await getStepsWithBookingsOnDate(selectedDate);
	}

	// Driver: my assignments for current month (for calendar and day list)
	let driverAssignments: Array<{ date: string; fromStageId: string; toStageId: string }> = [];
	if (user.role === 'driver') {
		const [y, m] = calendarMonth.split('-').map(Number);
		const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
		const lastDay = new Date(y, m, 0).getDate();
		const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
		driverAssignments = await getAssignmentsForDriver(user.id, startStr, endStr);
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
		allDrivers,
		calendarSummary,
		stepAssignments,
		bookedStepsForDate,
		calendarMonth,
		selectedDate,
		// Driver data
		driverAssignments,
		// Owner data
		ownerBookings,
		dailySales
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
	},

	// Admin: Assign or clear driver for a delivery step on a date (empty driverId = clear)
	assignDriverToStep: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const dateStr = formData.get('date')?.toString();
		const fromStageId = formData.get('fromStageId')?.toString();
		const toStageId = formData.get('toStageId')?.toString();
		const driverId = formData.get('driverId')?.toString() ?? '';
		if (!dateStr || !fromStageId || !toStageId) {
			return fail(400, { message: 'Date, fromStageId and toStageId are required.' });
		}
		if (!driverId) {
			await clearAssignment(dateStr, fromStageId, toStageId);
			const calendarMonth = formData.get('calendarMonth')?.toString() ?? getDefaultYearMonth();
			throw redirect(303, `/dashboard?calendarMonth=${calendarMonth}&selectedDate=${dateStr}`);
		}
		const [driverUser] = await db
			.select()
			.from(userTable)
			.where(and(eq(userTable.id, driverId), eq(userTable.role, 'driver')))
			.limit(1);
		if (!driverUser) {
			return fail(400, { message: 'Invalid driver.' });
		}
		await setAssignment(dateStr, fromStageId, toStageId, driverId);
		const calendarMonth = formData.get('calendarMonth')?.toString() ?? getDefaultYearMonth();
		throw redirect(303, `/dashboard?calendarMonth=${calendarMonth}&selectedDate=${dateStr}`);
	},

	// Admin: Bulk assign drivers for a day (matrix: one driver per step). Body: date, calendarMonth, step_fromId_toId = driverId (or empty).
	assignDriversForDay: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const dateStr = formData.get('date')?.toString();
		const calendarMonthParam = formData.get('calendarMonth')?.toString() ?? getDefaultYearMonth();
		if (!dateStr) {
			return fail(400, { message: 'Date is required.' });
		}
		const bookedSteps = await getStepsWithBookingsOnDate(dateStr);
		const driverUserIds = new Set(
			(await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.role, 'driver')))
				.map((r) => r.id)
		);
		for (const [fromId, toId] of bookedSteps) {
			const key = `step_${fromId}_${toId}`;
			const driverId = formData.get(key)?.toString() ?? '';
			if (!driverId) {
				await clearAssignment(dateStr, fromId, toId);
				continue;
			}
			if (!driverUserIds.has(driverId)) {
				return fail(400, { message: 'Invalid driver selected.' });
			}
			await setAssignment(dateStr, fromId, toId, driverId);
		}
		throw redirect(303, `/dashboard?calendarMonth=${calendarMonthParam}&selectedDate=${dateStr}`);
	}
};
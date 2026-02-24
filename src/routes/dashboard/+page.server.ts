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
import { hash } from '@node-rs/argon2';
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

/** Attach userFirstName/userLastName to each booking from user table (prefer user names over booking names). */
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
		const rawBookings = await db
			.select()
			.from(bookingTable)
			.where(eq(bookingTable.userId, user.id))
			.orderBy(desc(bookingTable.createdAt));
		bookings = await attachUserNamesToBookings(rawBookings);

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
		// Load all paid bookings for sales analytics (with user names for display)
		const rawOwnerBookings = await db
			.select()
			.from(bookingTable)
			.where(eq(bookingTable.status, 'paid'))
			.orderBy(desc(bookingTable.createdAt))
			.limit(100);
		ownerBookings = await attachUserNamesToBookings(rawOwnerBookings);

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

	// 6. Load admin data (all bookings, customers, drivers) — for both admin and owner
	let allBookings: any[] = [];
	let allCustomers: any[] = [];
	let allDrivers: any[] = [];

	if (user.role === 'admin' || user.role === 'owner') {
		// Load all bookings (with user names for display)
		const rawAllBookings = await db
			.select()
			.from(bookingTable)
			.orderBy(desc(bookingTable.createdAt));
		allBookings = await attachUserNamesToBookings(rawAllBookings);

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

		// Map drivers with their profiles (vehicleType deprecated, not used in UI)
		allDrivers = driverUsers.map((user) => {
			const profile = profiles.find((p) => p.userId === user.id);
			return {
				...user,
				licenseNumber: profile?.licenseNumber || null
			};
		});
	}

	// Admin/Owner: calendar summary, step assignments, and booked steps for selected date
	let calendarSummary: Array<{ date: string; hasActiveJourneys: boolean; hasDriverAssignments: boolean }> = [];
	let stepAssignments: Record<string, string> = {};
	let bookedStepsForDate: Array<[string, string]> = [];
	const calendarMonth = url.searchParams.get('calendarMonth') ?? getDefaultYearMonth();
	const selectedDate = url.searchParams.get('selectedDate') ?? getDefaultDateStr();

	if (user.role === 'admin' || user.role === 'owner') {
		calendarSummary = await getCalendarSummaryForMonth(calendarMonth);
		stepAssignments = await getAssignmentsForDate(selectedDate);
		bookedStepsForDate = await getStepsWithBookingsOnDate(selectedDate);
	}

	// Driver: my assignments for current month (for calendar and day list)
	let driverAssignments: Array<{
		date: string;
		fromStageId: string;
		toStageId: string;
		pickups?: Array<{ hotelName: string; bags: number }>;
		totalBags?: number;
	}> = [];
	if (user.role === 'driver') {
		const [y, m] = calendarMonth.split('-').map(Number);
		const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
		const lastDay = new Date(y, m, 0).getDate();
		const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
		const baseAssignments = await getAssignmentsForDriver(user.id, startStr, endStr);

		// Enrich each assignment with hotel pickup info and bag counts for that step/date
		driverAssignments = [];
		for (const a of baseAssignments) {
			const segments = await db
				.select({
					numBags: bookingTable.numBags,
					startHotelName: hotelTable.name
				})
				.from(bookingSegmentTable)
				.leftJoin(bookingTable, eq(bookingSegmentTable.bookingId, bookingTable.id))
				.leftJoin(hotelTable, eq(bookingSegmentTable.startHotelId, hotelTable.id))
				.where(
					and(
						eq(bookingSegmentTable.travelDate, new Date(a.date)),
						eq(bookingSegmentTable.fromStageId, a.fromStageId),
						eq(bookingSegmentTable.toStageId, a.toStageId)
					)
				);

			const pickups: Array<{ hotelName: string; bags: number }> = [];
			let totalBags = 0;

			for (const row of segments) {
				const bags = parseInt(row.numBags || '0', 10) || 0;
				if (!Number.isNaN(bags) && bags > 0) {
					totalBags += bags;
				}
				pickups.push({
					hotelName: row.startHotelName ?? 'Hotel not set',
					bags: bags
				});
			}

			driverAssignments.push({
				...a,
				pickups,
				totalBags
			});
		}
	}

	// 7. Owner only: load staff (admins + drivers) for Staff tab
	let allStaff: Array<{
		id: string;
		username: string;
		firstName: string | null;
		lastName: string | null;
		role: string;
		licenseNumber: string | null;
	}> = [];
	if (user.role === 'owner') {
		const staffUsers = await db
			.select()
			.from(userTable)
			.where(inArray(userTable.role, ['admin', 'driver']))
			.orderBy(userTable.username);
		const driverIds = staffUsers.filter((u) => u.role === 'driver').map((u) => u.id);
		const profiles =
			driverIds.length > 0
				? await db.select().from(driverProfile).where(inArray(driverProfile.userId, driverIds))
				: [];
		allStaff = staffUsers.map((u) => {
			const profile = u.role === 'driver' ? profiles.find((p) => p.userId === u.id) : null;
			return {
				id: u.id,
				username: u.username,
				firstName: u.firstName ?? null,
				lastName: u.lastName ?? null,
				role: u.role,
				licenseNumber: profile?.licenseNumber ?? null
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
		dailySales,
		allStaff
	};
};

function canPerformAdminActions(user: { role: string } | null): boolean {
	return !!user && (user.role === 'admin' || user.role === 'owner');
}

export const actions: Actions = {
	// Admin/Owner: Create hotel
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

	// Admin/Owner: Update hotel
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

	// Admin/Owner: Delete hotel
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

		// Update each segment: first segment gets start from form; later segments get start = previous segment's end
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const endHotelId = formData.get(`segment_${segment.id}_endHotel`)?.toString() || null;
			const hotelNotes = formData.get(`segment_${segment.id}_notes`)?.toString() || null;
			const startHotelId =
				i === 0
					? formData.get(`segment_${segment.id}_startHotel`)?.toString() || null
					: formData.get(`segment_${segments[i - 1].id}_endHotel`)?.toString() || null;

			await db
				.update(bookingSegmentTable)
				.set({
					startHotelId: startHotelId || null,
					endHotelId: endHotelId || null,
					hotelNotes: hotelNotes || null
				})
				.where(eq(bookingSegmentTable.id, segment.id));
		}

		return { success: true, message: 'Hotel information updated successfully' };
	},

	// Admin/Owner: Update booking
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
			.set({
				status,
				updatedAt: new Date()
			})
			.where(eq(bookingTable.id, bookingId));

		return { success: true, message: 'Booking updated successfully' };
	},

	// Admin/Owner: Delete booking
	deleteBooking: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
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

	// Admin/Owner: Update customer
	updateCustomer: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
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

	// Admin/Owner: Delete customer
	deleteCustomer: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
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

	// Admin/Owner: Update driver
	updateDriver: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const driverId = formData.get('driverId')?.toString();
		const username = formData.get('username')?.toString();
		const licenseNumber = formData.get('licenseNumber')?.toString() || null;

		if (!driverId || !username) {
			return fail(400, { message: 'Driver ID and email are required' });
		}

		// Update user (username = email)
		await db.update(userTable).set({ username: username.trim().toLowerCase() }).where(eq(userTable.id, driverId));

		// Update or create driver profile (license only; vehicleType deprecated)
		const [existingProfile] = await db
			.select()
			.from(driverProfile)
			.where(eq(driverProfile.userId, driverId));

		if (existingProfile) {
			await db
				.update(driverProfile)
				.set({ licenseNumber: licenseNumber || null })
				.where(eq(driverProfile.userId, driverId));
		} else if (licenseNumber) {
			await db.insert(driverProfile).values({
				userId: driverId,
				licenseNumber
			});
		}

		return { success: true, message: 'Driver updated successfully' };
	},

	// Admin/Owner: Delete driver
	deleteDriver: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
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

	// Admin/Owner: Assign or clear driver for a delivery step on a date (empty driverId = clear)
	assignDriverToStep: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
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

	// Admin/Owner: Bulk assign drivers for a day (matrix: one driver per step). Body: date, calendarMonth, step_fromId_toId = driverId (or empty).
	assignDriversForDay: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
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
	},

	// Owner only: Create staff (admin or driver). Email stored as username; when email is integrated, send onboarding here.
	createStaff: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const email = formData.get('username')?.toString()?.trim();
		const password = formData.get('password')?.toString();
		const firstName = formData.get('firstName')?.toString()?.trim();
		const lastName = formData.get('lastName')?.toString()?.trim();
		const role = formData.get('role')?.toString();
		const licenseNumber = formData.get('licenseNumber')?.toString()?.trim() || null;

		if (!email || email.length < 3) {
			return fail(400, { message: 'Email is required' });
		}
		if (!firstName?.trim()) {
			return fail(400, { message: 'First name is required' });
		}
		if (!lastName?.trim()) {
			return fail(400, { message: 'Last name is required' });
		}
		if (!password || password.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters' });
		}
		if (role !== 'admin' && role !== 'driver') {
			return fail(400, { message: 'Role must be admin or driver' });
		}
		if (role === 'driver' && !licenseNumber) {
			return fail(400, { message: 'License number is required for drivers' });
		}

		const username = email.toLowerCase();
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		const userId = crypto.randomUUID();

		try {
			await db.insert(userTable).values({
				id: userId,
				username,
				passwordHash,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				role: role as 'admin' | 'driver'
			});
			if (role === 'driver' && licenseNumber) {
				await db.insert(driverProfile).values({
					userId,
					licenseNumber
				});
			}
		} catch (e: unknown) {
			const err = e as { code?: string };
			if (err?.code === '23505') {
				return fail(400, { message: 'Email already in use' });
			}
			throw e;
		}
		return { success: true, message: 'Staff member added' };
	},

	// Owner only: Remove staff (delete user)
	removeStaff: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const staffId = formData.get('staffId')?.toString();
		if (!staffId) {
			return fail(400, { message: 'Staff ID is required' });
		}
		if (staffId === locals.user.id) {
			return fail(400, { message: 'You cannot remove yourself' });
		}
		const [staff] = await db.select().from(userTable).where(eq(userTable.id, staffId));
		if (!staff || (staff.role !== 'admin' && staff.role !== 'driver')) {
			return fail(400, { message: 'User is not staff' });
		}
		if (staff.role === 'driver') {
			await db.delete(driverProfile).where(eq(driverProfile.userId, staffId));
		}
		await db.delete(userTable).where(eq(userTable.id, staffId));
		return { success: true, message: 'Staff member removed' };
	}
};
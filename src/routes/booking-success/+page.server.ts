import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookingTable, bookingSegmentTable, userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-12-18.acacia'
});

export const load = async ({ url }) => {
	const sessionId = url.searchParams.get('session_id');

	if (!sessionId) {
		throw redirect(302, '/');
	}

	try {
		// Retrieve the Stripe session to get the bookingId from metadata
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (!session.metadata?.bookingId) {
			throw error(404, 'Booking not found');
		}

		const bookingId = session.metadata.bookingId;

		// Load the booking
		const [booking] = await db
			.select()
			.from(bookingTable)
			.where(eq(bookingTable.id, bookingId))
			.limit(1);

		if (!booking) {
			throw error(404, 'Booking not found');
		}

		// Prefer user names over booking names for display
		let userFirstName: string | null = null;
		let userLastName: string | null = null;
		if (booking.userId) {
			const [user] = await db
				.select({ firstName: userTable.firstName, lastName: userTable.lastName })
				.from(userTable)
				.where(eq(userTable.id, booking.userId))
				.limit(1);
			if (user) {
				userFirstName = user.firstName;
				userLastName = user.lastName;
			}
		}
		const bookingWithUserNames = {
			...booking,
			userFirstName,
			userLastName
		};

		// Load booking segments
		const allSegments = await db
			.select()
			.from(bookingSegmentTable)
			.where(eq(bookingSegmentTable.bookingId, bookingId));

		// Sort segments by index (stored as text, so convert to number for sorting)
		const segments = allSegments.sort((a, b) => {
			const aIdx = parseInt(a.segmentIndex || '0', 10);
			const bIdx = parseInt(b.segmentIndex || '0', 10);
			return aIdx - bIdx;
		});

		return {
			booking: bookingWithUserNames,
			segments
		};
	} catch (err: any) {
		console.error('Error loading booking:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to load booking details');
	}
};

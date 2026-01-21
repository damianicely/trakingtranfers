import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { bookingTable, bookingSegmentTable } from '$lib/server/db/schema';
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
			booking,
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

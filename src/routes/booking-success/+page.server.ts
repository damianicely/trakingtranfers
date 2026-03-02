import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	bookingTable,
	bookingSegmentTable,
	userTable,
	passwordResetTokenTable
} from '$lib/server/db/schema';
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
		console.log('[booking-success] Loading booking for session:', sessionId);

		// Retrieve the Stripe session to get the bookingId from metadata
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		console.log('[booking-success] Stripe session retrieved. Metadata:', session.metadata);

		if (!session.metadata?.bookingId) {
			console.error('[booking-success] No bookingId in session metadata');
			throw error(404, 'Booking not found');
		}

		const bookingId = session.metadata.bookingId;
		console.log('[booking-success] Booking ID:', bookingId);

		// Load the booking
		const [booking] = await db
			.select()
			.from(bookingTable)
			.where(eq(bookingTable.id, bookingId))
			.limit(1);

		if (!booking) {
			console.error('[booking-success] Booking not found in database:', bookingId);
			throw error(404, 'Booking not found');
		}
		console.log(
			'[booking-success] Booking loaded. Status:',
			booking.status,
			'UserId:',
			booking.userId
		);

		// Prefer user names over booking names for display
		let userFirstName: string | null = null;
		let userLastName: string | null = null;
		let passwordResetUrl: string | null = null;

		if (booking.userId) {
			console.log('[booking-success] Loading user data for userId:', booking.userId);
			const [user] = await db
				.select({ firstName: userTable.firstName, lastName: userTable.lastName })
				.from(userTable)
				.where(eq(userTable.id, booking.userId))
				.limit(1);
			if (user) {
				userFirstName = user.firstName;
				userLastName = user.lastName;
				console.log('[booking-success] User found:', user.firstName, user.lastName);

				// Look for password reset token for this user
				console.log('[booking-success] Looking for password reset token...');
				const [resetToken] = await db
					.select()
					.from(passwordResetTokenTable)
					.where(eq(passwordResetTokenTable.userId, booking.userId))
					.orderBy(passwordResetTokenTable.expiresAt)
					.limit(1);

				if (resetToken) {
					console.log('[booking-success] Password reset token found:', resetToken.id);
					console.log('[booking-success] Token expires at:', resetToken.expiresAt);

					// Check if token is still valid
					const now = new Date();
					if (resetToken.expiresAt > now) {
						const origin = url.origin;
						passwordResetUrl = `${origin}/reset-password/${resetToken.id}`;
						console.log('[booking-success] Password reset URL generated:', passwordResetUrl);
					} else {
						console.log('[booking-success] Password reset token has expired');
					}
				} else {
					console.log('[booking-success] No password reset token found for this user');
				}
			} else {
				console.log('[booking-success] User not found for userId:', booking.userId);
			}
		} else {
			console.log('[booking-success] No userId associated with booking');
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

		console.log(
			'[booking-success] Returning data with passwordResetUrl:',
			passwordResetUrl ? 'PRESENT' : 'NULL'
		);

		return {
			booking: bookingWithUserNames,
			segments,
			passwordResetUrl
		};
	} catch (err: any) {
		console.error('[booking-success] Error loading booking:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to load booking details');
	}
};

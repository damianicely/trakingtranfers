import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { db } from '$lib/server/db';
import { bookingTable, userTable } from '$lib/server/db/schema';
import { createBagsForBooking } from '$lib/server/bag/create-bags-for-booking';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import crypto from 'node:crypto';
import { createPasswordResetToken } from '$lib/server/auth/password-reset';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-12-18.acacia'
});

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return new Response('Missing Stripe signature', { status: 400 });
	}

	const rawBody = await request.text();

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err: any) {
		console.error('Stripe webhook signature verification failed:', err?.message || err);
		return new Response('Webhook signature verification failed', { status: 400 });
	}

	console.log(`[Stripe Webhook] Received event: ${event.type}`);

	if (event.type === 'checkout.session.completed') {
		console.log('[Stripe Webhook] Processing checkout.session.completed');
		const session = event.data.object as Stripe.Checkout.Session;

		const bookingId = session.metadata?.bookingId;
		console.log('[Stripe Webhook] Booking ID from metadata:', bookingId);

		if (!bookingId) {
			console.error('checkout.session.completed without bookingId metadata');
			return new Response('Missing bookingId metadata', { status: 400 });
		}

		// Extract customer email (used as username) from session
		const email =
			session.customer_details?.email ?? (session.customer_email as string | null) ?? null;

		if (!email) {
			console.error('checkout.session.completed without customer email');
			// We still mark the booking as paid, but cannot auto-register a user
			await db.update(bookingTable).set({ status: 'paid' }).where(eq(bookingTable.id, bookingId));
			try {
				await createBagsForBooking(db, bookingId);
			} catch (bagErr) {
				console.error('Bag creation failed (booking still marked paid):', bagErr);
			}
			return new Response('Booking updated without user (no email)', { status: 200 });
		}

		const username = email.toLowerCase();

		// Find booking, find or create user, then link booking and create password reset token
		try {
			// 0. Check that the booking actually exists and get names for user backfill
			const existingBookings = await db
				.select()
				.from(bookingTable)
				.where(eq(bookingTable.id, bookingId));

			if (existingBookings.length === 0) {
				console.error('No booking found for bookingId from metadata:', bookingId);
				return new Response('Booking not found', { status: 200 });
			}
			const booking = existingBookings[0];
			const bookingFirstName = booking.firstName?.trim() || null;
			const bookingLastName = booking.lastName?.trim() || null;

			// 1. Check if the user already exists
			const existingUsers = await db
				.select()
				.from(userTable)
				.where(eq(userTable.username, username));

			let userId: string;

			if (existingUsers.length > 0) {
				userId = existingUsers[0].id;
				console.log('[Stripe Webhook] EXISTING user found:', username, 'UserID:', userId);
				// Backfill user names from this booking if user has none
				if (
					(bookingFirstName || bookingLastName) &&
					(!existingUsers[0].firstName || !existingUsers[0].lastName)
				) {
					await db
						.update(userTable)
						.set({
							firstName: existingUsers[0].firstName ?? bookingFirstName,
							lastName: existingUsers[0].lastName ?? bookingLastName
						})
						.where(eq(userTable.id, userId));
				}
			} else {
				// 2. Auto-register a new customer with a random password and names from booking
				console.log('[Stripe Webhook] Creating NEW user for:', username);
				const randomPassword = crypto.randomBytes(32).toString('hex');
				const passwordHash = await hash(randomPassword, {
					memoryCost: 19456,
					timeCost: 2,
					outputLen: 32,
					parallelism: 1
				});

				userId = crypto.randomBytes(15).toString('hex');
				console.log('[Stripe Webhook] Generated userId:', userId);

				await db.insert(userTable).values({
					id: userId,
					username,
					passwordHash,
					firstName: bookingFirstName,
					lastName: bookingLastName
				});
				console.log('[Stripe Webhook] User inserted into database');
			}

			// 3. Update the booking: mark as paid and link to user + session id
			await db
				.update(bookingTable)
				.set({
					status: 'paid',
					userId,
					stripeSessionId: session.id
				})
				.where(eq(bookingTable.id, bookingId));

			try {
				await createBagsForBooking(db, bookingId);
			} catch (bagErr) {
				console.error('Bag creation failed (booking still marked paid):', bagErr);
			}

			// 4. Generate a password reset token so the guest can set their password
			console.log(
				'[Stripe Webhook] Step 4: Creating password reset token for user:',
				username,
				'UserID:',
				userId
			);

			let resetUrl: string;
			try {
				const result = await createPasswordResetToken(userId, 24, 'http://localhost:5173');
				resetUrl = result.resetUrl;
				console.log('[Stripe Webhook] Token created successfully');
			} catch (tokenErr) {
				console.error('[Stripe Webhook] FAILED to create password reset token:', tokenErr);
				throw tokenErr;
			}

			// For now, "send" the email by logging the reset link
			console.log('\n========================================');
			console.log('PASSWORD SETUP LINK:');
			console.log(`User: ${username}`);
			console.log(`Link: ${resetUrl}`);
			console.log('========================================\n');
			console.log('[Stripe Webhook] Processing completed successfully');

			// Force flush console output
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (err) {
			console.error('[Stripe Webhook] CRITICAL ERROR:', err);
			console.error('Error details:', err instanceof Error ? err.stack : String(err));
			// Still return 200 so Stripe doesn't retry endlessly while you debug
			return new Response('Webhook processing error', { status: 200 });
		}
	}

	// For all other event types, just acknowledge
	return new Response('ok', { status: 200 });
};

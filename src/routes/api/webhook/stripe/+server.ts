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
	console.log('\n========================================');
	console.log('[STRIPE WEBHOOK] ===== POST HANDLER ENTERED =====');
	console.log('[STRIPE WEBHOOK] Timestamp:', new Date().toISOString());
	console.log('========================================\n');

	try {
		const signature = request.headers.get('stripe-signature');
		console.log('[STRIPE WEBHOOK] stripe-signature header:', signature ? 'PRESENT' : 'MISSING');

		if (!signature) {
			console.error('[STRIPE WEBHOOK] ERROR: Missing Stripe signature');
			return new Response('Missing Stripe signature', { status: 400 });
		}

		console.log('[STRIPE WEBHOOK] Reading request body...');
		const rawBody = await request.text();
		console.log('[STRIPE WEBHOOK] Request body length:', rawBody.length, 'bytes');

		let event: Stripe.Event;

		try {
			event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
		} catch (err: any) {
			console.error('Stripe webhook signature verification failed:', err?.message || err);
			return new Response('Webhook signature verification failed', { status: 400 });
		}

		console.log('[STRIPE WEBHOOK] Signature verification successful!');
		console.log(`[STRIPE WEBHOOK] Received event type: ${event.type}`);
		console.log('[STRIPE WEBHOOK] Event ID:', event.id);
		console.log('[STRIPE WEBHOOK] Created:', new Date(event.created * 1000).toISOString());

		if (event.type === 'checkout.session.completed') {
			console.log('\n[STRIPE WEBHOOK] ===== PROCESSING CHECKOUT.SESSION.COMPLETED =====');
			const session = event.data.object as Stripe.Checkout.Session;

			console.log('[STRIPE WEBHOOK] Session details:');
			console.log('  - session.id:', session.id);
			console.log('  - session.status:', session.status);
			console.log('  - session.payment_status:', session.payment_status);
			console.log('  - session.amount_total:', session.amount_total);
			console.log('  - session.currency:', session.currency);

			const bookingId = session.metadata?.bookingId;
			console.log('[STRIPE WEBHOOK] Booking ID from metadata:', bookingId);
			console.log('[STRIPE WEBHOOK] Full metadata:', JSON.stringify(session.metadata, null, 2));

			if (!bookingId) {
				console.error('[STRIPE WEBHOOK] ERROR: No bookingId in metadata!');
				console.error('[STRIPE WEBHOOK] Available metadata:', session.metadata);
				return new Response('Missing bookingId metadata', { status: 400 });
			}
			console.log('[STRIPE WEBHOOK] BookingId extracted successfully:', bookingId);

			// Extract customer email (used as username) from session
			console.log('[STRIPE WEBHOOK] Extracting customer email...');
			console.log('[STRIPE WEBHOOK] session.customer_details:', session.customer_details);
			console.log('[STRIPE WEBHOOK] session.customer_email:', session.customer_email);

			const email =
				session.customer_details?.email ?? (session.customer_email as string | null) ?? null;

			console.log('[STRIPE WEBHOOK] Extracted email:', email);

			if (!email) {
				console.error('[STRIPE WEBHOOK] ERROR: No customer email found!');
				console.log('[STRIPE WEBHOOK] Updating booking status to paid (no email path)...');
				// We still mark the booking as paid, but cannot auto-register a user
				await db.update(bookingTable).set({ status: 'paid' }).where(eq(bookingTable.id, bookingId));
				console.log('[STRIPE WEBHOOK] Booking status updated to paid');
				try {
					console.log('[STRIPE WEBHOOK] Creating bags for booking (no email path)...');
					await createBagsForBooking(db, bookingId);
				} catch (bagErr) {
					console.error(
						'[STRIPE WEBHOOK] Bag creation failed (booking still marked paid):',
						bagErr
					);
				}
				console.log('[STRIPE WEBHOOK] Returning response (no email path)');
				return new Response('Booking updated without user (no email)', { status: 200 });
			}
			console.log('[STRIPE WEBHOOK] Email found:', email);

			const username = email.toLowerCase();

			// Find booking, find or create user, then link booking and create password reset token
			try {
				console.log('\n[STRIPE WEBHOOK] ===== STEP 0: Lookup Booking =====');
				console.log('[STRIPE WEBHOOK] Looking up booking in database:', bookingId);
				const existingBookings = await db
					.select()
					.from(bookingTable)
					.where(eq(bookingTable.id, bookingId));

				console.log('[STRIPE WEBHOOK] Booking query result:', existingBookings.length, 'found');
				if (existingBookings.length === 0) {
					console.error('[STRIPE WEBHOOK] ERROR: No booking found for bookingId:', bookingId);
					return new Response('Booking not found', { status: 200 });
				}

				const booking = existingBookings[0];
				console.log('[STRIPE WEBHOOK] Booking found:');
				console.log('  - id:', booking.id);
				console.log('  - status:', booking.status);
				console.log('  - firstName:', booking.firstName);
				console.log('  - lastName:', booking.lastName);
				console.log('  - email:', booking.email);

				const bookingFirstName = booking.firstName?.trim() || null;
				const bookingLastName = booking.lastName?.trim() || null;
				console.log('[STRIPE WEBHOOK] Extracted names from booking:', {
					bookingFirstName,
					bookingLastName
				});

				console.log('\n[STRIPE WEBHOOK] ===== STEP 1: Check/Create User =====');
				console.log('[STRIPE WEBHOOK] Looking up user:', username);
				const existingUsers = await db
					.select()
					.from(userTable)
					.where(eq(userTable.username, username));

				console.log('[STRIPE WEBHOOK] User query result:', existingUsers.length, 'found');
				let userId: string;

				if (existingUsers.length > 0) {
					userId = existingUsers[0].id;
					console.log('[STRIPE WEBHOOK] EXISTING user found:');
					console.log('  - userId:', userId);
					console.log('  - username:', existingUsers[0].username);
					console.log('  - firstName:', existingUsers[0].firstName);
					console.log('  - lastName:', existingUsers[0].lastName);

					// Backfill user names from this booking if user has none
					if (
						(bookingFirstName || bookingLastName) &&
						(!existingUsers[0].firstName || !existingUsers[0].lastName)
					) {
						console.log('[STRIPE WEBHOOK] Backfilling user names from booking...');
						await db
							.update(userTable)
							.set({
								firstName: existingUsers[0].firstName ?? bookingFirstName,
								lastName: existingUsers[0].lastName ?? bookingLastName
							})
							.where(eq(userTable.id, userId));
						console.log('[STRIPE WEBHOOK] User names backfilled successfully');
					} else {
						console.log('[STRIPE WEBHOOK] User already has names or no names to backfill');
					}
				} else {
					console.log('[STRIPE WEBHOOK] Creating NEW user for:', username);
					const randomPassword = crypto.randomBytes(32).toString('hex');
					console.log('[STRIPE WEBHOOK] Generated random password (32 bytes)');

					const passwordHash = await hash(randomPassword, {
						memoryCost: 19456,
						timeCost: 2,
						outputLen: 32,
						parallelism: 1
					});
					console.log('[STRIPE WEBHOOK] Password hashed successfully');

					userId = crypto.randomBytes(15).toString('hex');
					console.log('[STRIPE WEBHOOK] Generated userId:', userId);

					console.log('[STRIPE WEBHOOK] Inserting new user into database...');
					await db.insert(userTable).values({
						id: userId,
						username,
						passwordHash,
						firstName: bookingFirstName,
						lastName: bookingLastName
					});
					console.log('[STRIPE WEBHOOK] User inserted into database successfully');
				}

				console.log('\n[STRIPE WEBHOOK] ===== STEP 3: Update Booking Status =====');
				console.log('[STRIPE WEBHOOK] Updating booking to paid status:');
				console.log('  - bookingId:', bookingId);
				console.log('  - userId:', userId);
				console.log('  - stripeSessionId:', session.id);

				await db
					.update(bookingTable)
					.set({
						status: 'paid',
						userId,
						stripeSessionId: session.id
					})
					.where(eq(bookingTable.id, bookingId));
				console.log('[STRIPE WEBHOOK] Booking updated successfully');

				console.log('\n[STRIPE WEBHOOK] ===== CREATING BAGS =====');
				try {
					console.log('[STRIPE WEBHOOK] Calling createBagsForBooking...');
					await createBagsForBooking(db, bookingId);
					console.log('[STRIPE WEBHOOK] Bags created successfully');
				} catch (bagErr) {
					console.error(
						'[STRIPE WEBHOOK] ERROR: Bag creation failed (booking still marked paid):',
						bagErr
					);
				}

				console.log('\n[STRIPE WEBHOOK] ===== STEP 4: Create Password Reset Token =====');
				console.log('[STRIPE WEBHOOK] Creating password reset token for:');
				console.log('  - username:', username);
				console.log('  - userId:', userId);

				let resetUrl: string;
				try {
					console.log('[STRIPE WEBHOOK] Calling createPasswordResetToken...');
					const result = await createPasswordResetToken(userId, 24, 'http://localhost:5173');
					resetUrl = result.resetUrl;
					console.log('[STRIPE WEBHOOK] Password reset token created successfully');
				} catch (tokenErr) {
					console.error('[STRIPE WEBHOOK] ERROR: FAILED to create password reset token:', tokenErr);
					throw tokenErr;
				}

				// For now, "send" the email by logging the reset link
				console.log('\n========================================');
				console.log('PASSWORD SETUP LINK:');
				console.log(`User: ${username}`);
				console.log(`Link: ${resetUrl}`);
				console.log('========================================\n');
				console.log('[STRIPE WEBHOOK] ===== PROCESSING COMPLETED SUCCESSFULLY =====');
				console.log('[STRIPE WEBHOOK] All steps completed for booking:', bookingId);

				// Force flush console output
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (err) {
				console.error('\n[STRIPE WEBHOOK] ===== CRITICAL ERROR =====');
				console.error('[STRIPE WEBHOOK] Error:', err);
				console.error('[STRIPE WEBHOOK] Stack:', err instanceof Error ? err.stack : String(err));
				console.error('[STRIPE WEBHOOK] ===== END CRITICAL ERROR =====\n');
				// Still return 200 so Stripe doesn't retry endlessly while you debug
				return new Response('Webhook processing error', { status: 200 });
			}
		}

		// For all other event types, just acknowledge
		console.log('[STRIPE WEBHOOK] Event type not handled:', event?.type || 'unknown');
		return new Response('ok', { status: 200 });
	} catch (error) {
		console.error('\n========================================');
		console.error('[STRIPE WEBHOOK] ===== CRITICAL ERROR =====');
		console.error('[STRIPE WEBHOOK] Error:', error);
		console.error(
			'[STRIPE WEBHOOK] Stack:',
			error instanceof Error ? error.stack : 'No stack trace'
		);
		console.error('========================================\n');
		return new Response('Webhook processing error', { status: 200 });
	}
};

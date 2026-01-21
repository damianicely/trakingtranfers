import type { RequestHandler } from './$types';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { db } from '$lib/server/db';
import { bookingTable, passwordResetTokenTable, userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import crypto from 'node:crypto';

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

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session;

		const bookingId = session.metadata?.bookingId;

		if (!bookingId) {
			console.error('checkout.session.completed without bookingId metadata');
			return new Response('Missing bookingId metadata', { status: 400 });
		}

		// Extract customer email (used as username) from session
		const email =
			session.customer_details?.email ??
			(session.customer_email as string | null) ??
			null;

		if (!email) {
			console.error('checkout.session.completed without customer email');
			// We still mark the booking as paid, but cannot auto-register a user
			await db
				.update(bookingTable)
				.set({ status: 'paid' })
				.where(eq(bookingTable.id, bookingId));

			return new Response('Booking updated without user (no email)', { status: 200 });
		}

		const username = email.toLowerCase();

		// Find booking, find or create user, then link booking and create password reset token
		try {
			// 0. Check that the booking actually exists
			const existingBookings = await db
				.select()
				.from(bookingTable)
				.where(eq(bookingTable.id, bookingId));

			if (existingBookings.length === 0) {
				console.error('No booking found for bookingId from metadata:', bookingId);
				return new Response('Booking not found', { status: 200 });
			}

			// 1. Check if the user already exists
			const existingUsers = await db
				.select()
				.from(userTable)
				.where(eq(userTable.username, username));

			let userId: string;

			if (existingUsers.length > 0) {
				userId = existingUsers[0].id;
			} else {
				// 2. Auto-register a new customer with a random password
				const randomPassword = crypto.randomBytes(32).toString('hex');
				const passwordHash = await hash(randomPassword, {
					memoryCost: 19456,
					timeCost: 2,
					outputLen: 32,
					parallelism: 1
				});

				userId = crypto.randomBytes(15).toString('hex');

				await db.insert(userTable).values({
					id: userId,
					username,
					passwordHash
					// role defaults to 'customer' in the schema
				});
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

			// 4. Generate a password reset token so the guest can set their password
			const tokenId = crypto.randomUUID();
			const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours from now

			await db.insert(passwordResetTokenTable).values({
				id: tokenId,
				userId,
				expiresAt
			});

			// For now, "send" the email by logging the reset link
			const resetUrl = `http://localhost:5173/reset-password/${tokenId}`;
			console.log(`Password setup link for ${username}: ${resetUrl}`);
		} catch (err) {
			console.error('Error handling checkout.session.completed:', err);
			// Still return 200 so Stripe doesn't retry endlessly while you debug
			return new Response('Webhook processing error', { status: 200 });
		}
	}

	// For all other event types, just acknowledge
	return new Response('ok', { status: 200 });
};


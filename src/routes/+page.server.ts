import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookingTable, bookingSegmentTable } from '$lib/server/db/schema';
import { checkEmailExists, checkDailyCapacity } from '$lib/server/booking/checks';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-12-18.acacia'
});

// === LOGGING TEST #3: Load function log ===
export const load: PageServerLoad = async ({ locals }) => {
	console.log('[TEST 3] Hello World from +page.server.ts load function!');
	console.log('[TEST 3] User:', locals.user?.username ?? 'Guest');
	return {};
};

export const actions: Actions = {
	createCheckout: async ({ request, locals, url }) => {
		console.log('[createCheckout] ===== ACTION STARTED =====');
		console.log('[createCheckout] Request URL:', url.href);
		console.log('[createCheckout] User:', locals.user?.username ?? 'Guest');

		const formData = await request.formData();

		// Expect the total amount (in EUR) and booking details to be posted from the client
		const amountStr = formData.get('amount')?.toString() ?? '';
		const bookingPayloadStr = formData.get('bookingPayload')?.toString() ?? '';

		console.log('[createCheckout] amountStr:', amountStr);
		console.log('[createCheckout] bookingPayloadStr length:', bookingPayloadStr?.length ?? 0);

		const amount = Number(amountStr);

		if (!amount || isNaN(amount) || amount <= 0) {
			console.error('[createCheckout] VALIDATION FAILED: Invalid amount:', amountStr);
			return fail(400, { message: 'Invalid amount', amount: amountStr });
		}

		if (!bookingPayloadStr) {
			console.error('[createCheckout] VALIDATION FAILED: Missing booking payload');
			return fail(400, { message: 'Missing booking payload' });
		}

		let bookingPayload: any;
		try {
			bookingPayload = JSON.parse(bookingPayloadStr);
			console.log('[createCheckout] bookingPayload parsed successfully');
		} catch (e) {
			console.error('[createCheckout] VALIDATION FAILED: Failed to parse bookingPayload:', e);
			return fail(400, { message: 'Invalid booking payload' });
		}

		const basicDetails = bookingPayload.basicDetails || {};
		const aboutTrip = bookingPayload.aboutTrip || {};
		const route = bookingPayload.route as [string, string][] | null;

		const firstName = (basicDetails.firstName || '').toString();
		const lastName = (basicDetails.lastName || '').toString();
		const bookingOtherNames = (basicDetails.bookingNames || '').toString();
		const email = (basicDetails.email || '').toString();
		const phone = (basicDetails.phone || '').toString();

		const departureDateStr = (aboutTrip.departureDate || '').toString();
		const departureStageId = (aboutTrip.departure || '').toString();
		const destinationStageId = (aboutTrip.destination || '').toString();
		const direction = (aboutTrip.direction || '').toString();
		const numBags = (aboutTrip.bags || '').toString();

		console.log('[createCheckout] Parsed form data:');
		console.log('  - firstName:', firstName);
		console.log('  - lastName:', lastName);
		console.log('  - email:', email);
		console.log('  - phone:', phone);
		console.log('  - departureDate:', departureDateStr);
		console.log('  - numBags:', numBags);
		console.log('  - route:', route?.length ?? 0, 'legs');

		if (!departureDateStr || !departureStageId || !destinationStageId) {
			console.error('[createCheckout] VALIDATION FAILED: Missing trip details');
			console.error('  departureDate:', departureDateStr);
			console.error('  departureStageId:', departureStageId);
			console.error('  destinationStageId:', destinationStageId);
			return fail(400, { message: 'Missing trip details' });
		}

		const departureDate = new Date(departureDateStr);

		// Server-side checks: when logged in, require email matches user; otherwise check not already registered
		const emailNorm = email.trim().toLowerCase();
		console.log('[createCheckout] Checking email for user:', emailNorm);

		if (locals.user) {
			if (emailNorm !== locals.user.username.trim().toLowerCase()) {
				console.error('[createCheckout] VALIDATION FAILED: Email mismatch');
				console.error('  provided:', emailNorm);
				console.error('  expected:', locals.user.username.trim().toLowerCase());
				return fail(400, { message: 'Email must match your account.' });
			}
			console.log('[createCheckout] Email check passed (logged in user)');
		} else {
			console.log('[createCheckout] Checking email exists for guest user:', email);
			const emailCheck = await checkEmailExists(email);
			if (!emailCheck.ok) {
				console.error(
					'[createCheckout] VALIDATION FAILED: Email check failed:',
					emailCheck.message
				);
				return fail(400, { message: emailCheck.message });
			}
			console.log('[createCheckout] Email check passed (guest user)');
		}

		console.log('[createCheckout] Checking availability for:', departureDateStr);
		const availabilityCheck = await checkDailyCapacity(departureDateStr, route);
		if (!availabilityCheck.ok) {
			console.error(
				'[createCheckout] VALIDATION FAILED: Availability check failed:',
				availabilityCheck.message
			);
			return fail(400, { message: availabilityCheck.message });
		}
		console.log('[createCheckout] Availability check passed');

		const numTransfers = route ? route.length.toString() : '0';
		const totalPrice = amountStr; // store EUR amount as provided

		// Create a booking record first
		const bookingId = crypto.randomUUID();
		console.log('[createCheckout] Generated bookingId:', bookingId);

		console.log('[createCheckout] Inserting booking into database...');
		await db.insert(bookingTable).values({
			id: bookingId,
			userId: locals.user?.id ?? null,
			status: 'pending',
			stripeSessionId: null,
			firstName,
			lastName,
			bookingOtherNames,
			email,
			phone,
			departureDate,
			direction,
			departureStageId,
			destinationStageId,
			numBags,
			numTransfers,
			totalPrice
		});
		console.log('[createCheckout] Booking inserted successfully');

		// Create booking segments for each route leg
		if (route && route.length > 0) {
			console.log('[createCheckout] Creating', route.length, 'booking segments...');
			const segmentsToInsert = route.map(([from, to], index) => {
				const travelDate = new Date(departureDate);
				travelDate.setDate(travelDate.getDate() + index);

				return {
					id: crypto.randomUUID(),
					bookingId,
					segmentIndex: index.toString(),
					fromStageId: from,
					toStageId: to,
					travelDate
				};
			});

			if (segmentsToInsert.length > 0) {
				await db.insert(bookingSegmentTable).values(segmentsToInsert);
				console.log('[createCheckout] Booking segments created:', segmentsToInsert.length);
			}
		} else {
			console.log('[createCheckout] No route segments to create');
		}

		// Create Stripe Checkout Session with bookingId in metadata
		console.log('[createCheckout] Creating Stripe checkout session...');
		console.log('[createCheckout] Stripe request details:');
		console.log('  - amount (EUR):', amount);
		console.log('  - email:', email);
		console.log('  - bookingId:', bookingId);
		console.log(
			'  - success_url:',
			`${url.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`
		);

		let session;
		try {
			session = await stripe.checkout.sessions.create({
				mode: 'payment',
				customer_email: email, // Pre-fill email in Checkout form
				line_items: [
					{
						price_data: {
							currency: 'eur',
							product_data: {
								name: 'Luggage transfer booking'
							},
							unit_amount: Math.round(amount * 100) // convert EUR to cents
						},
						quantity: 1
					}
				],
				metadata: {
					bookingId
				},
				success_url: `${url.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${url.origin}/?canceled=1`
			});
			console.log('[createCheckout] Stripe session created successfully!');
			console.log('[createCheckout] session.id:', session.id);
			console.log('[createCheckout] session.url:', session.url);
		} catch (stripeError) {
			console.error('[createCheckout] STRIPE ERROR:', stripeError);
			return fail(500, { message: 'Failed to create Stripe session', error: String(stripeError) });
		}

		// Persist Stripe session ID on the booking
		if (session.id) {
			console.log('[createCheckout] Updating booking with Stripe session ID...');
			await db
				.update(bookingTable)
				.set({ stripeSessionId: session.id })
				.where(eq(bookingTable.id, bookingId));
			console.log('[createCheckout] Booking updated with stripeSessionId');
		}

		// Return the Checkout URL so the client can redirect
		// Form actions must return plain objects (not json() helper)
		console.log('[createCheckout] ===== ACTION COMPLETED SUCCESSFULLY =====');
		console.log('[createCheckout] Returning checkout URL to client');
		console.log('[createCheckout] bookingId:', bookingId);
		console.log('[createCheckout] checkout URL:', session.url);
		return {
			url: session.url,
			bookingId
		};
	}
};

import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { bookingTable, bookingSegmentTable } from '$lib/server/db/schema';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2024-12-18.acacia'
});

export const actions: Actions = {
	createCheckout: async ({ request, locals, url }) => {
		const formData = await request.formData();

		// Expect the total amount (in EUR) and booking details to be posted from the client
		const amountStr = formData.get('amount')?.toString() ?? '';
		const bookingPayloadStr = formData.get('bookingPayload')?.toString() ?? '';

		const amount = Number(amountStr);

		if (!amount || isNaN(amount) || amount <= 0) {
			return fail(400, { message: 'Invalid amount', amount: amountStr });
		}

		if (!bookingPayloadStr) {
			return fail(400, { message: 'Missing booking payload' });
		}

		let bookingPayload: any;
		try {
			bookingPayload = JSON.parse(bookingPayloadStr);
		} catch (e) {
			console.error('Failed to parse bookingPayload:', e);
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

		if (!departureDateStr || !departureStageId || !destinationStageId) {
			return fail(400, { message: 'Missing trip details' });
		}

		const departureDate = new Date(departureDateStr);

		const numTransfers = route ? route.length.toString() : '0';
		const totalPrice = amountStr; // store EUR amount as provided

		// Create a booking record first
		const bookingId = crypto.randomUUID();

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

		// Create booking segments for each route leg
		if (route && route.length > 0) {
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
			}
		}

		// Create Stripe Checkout Session with bookingId in metadata
		const session = await stripe.checkout.sessions.create({
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

		// Persist Stripe session ID on the booking
		if (session.id) {
			await db
				.update(bookingTable)
				.set({ stripeSessionId: session.id })
				.where(eq(bookingTable.id, bookingId));
		}

		// Return the Checkout URL so the client can redirect
		// Form actions must return plain objects (not json() helper)
		return {
			url: session.url,
			bookingId
		};
	}
};


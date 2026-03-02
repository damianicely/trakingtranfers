import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../db/schema';
import { bagTable, bagLegTable, bookingTable, bookingSegmentTable } from '../db/schema';
import { eq } from 'drizzle-orm';

type Db = NodePgDatabase<typeof schema>;

/** Generate label for bag index (0-based): A, B, ... Z, AA, AB, ... */
function bagLabel(index: number): string {
	if (index < 26) return String.fromCodePoint(65 + index);
	const first = Math.floor(index / 26) - 1;
	const second = index % 26;
	return String.fromCodePoint(65 + first) + String.fromCodePoint(65 + second);
}

/**
 * Create bag and bag_leg rows for a paid booking. Idempotent: if bags already exist for this booking, does nothing.
 * Requires booking to have segments and numBags > 0.
 */
export async function createBagsForBooking(
	dbInstance: Db,
	bookingId: string
): Promise<{ created: number }> {
	console.log('[createBagsForBooking] ===== START =====');
	console.log('[createBagsForBooking] bookingId:', bookingId);

	const [booking] = await dbInstance
		.select({ id: bookingTable.id, numBags: bookingTable.numBags })
		.from(bookingTable)
		.where(eq(bookingTable.id, bookingId))
		.limit(1);

	if (!booking) {
		console.error('[createBagsForBooking] ERROR: Booking not found:', bookingId);
		return { created: 0 };
	}
	console.log('[createBagsForBooking] Booking found, numBags:', booking.numBags);

	const numBags = Math.max(0, parseInt(String(booking.numBags ?? '0'), 10) || 0);
	console.log('[createBagsForBooking] Parsed numBags:', numBags);

	if (numBags === 0) {
		console.log('[createBagsForBooking] No bags to create (numBags is 0)');
		return { created: 0 };
	}

	console.log('[createBagsForBooking] Checking for existing bags...');
	const existingBags = await dbInstance
		.select({ id: bagTable.id })
		.from(bagTable)
		.where(eq(bagTable.bookingId, bookingId))
		.limit(1);

	if (existingBags.length > 0) {
		console.log('[createBagsForBooking] Bags already exist for this booking, skipping');
		return { created: 0 };
	}
	console.log('[createBagsForBooking] No existing bags found, proceeding to create');

	console.log('[createBagsForBooking] Fetching booking segments...');
	const segmentRows = await dbInstance
		.select({
			id: bookingSegmentTable.id,
			segmentIndex: bookingSegmentTable.segmentIndex
		})
		.from(bookingSegmentTable)
		.where(eq(bookingSegmentTable.bookingId, bookingId));

	console.log('[createBagsForBooking] Found', segmentRows.length, 'segments');

	const segments = segmentRows.sort(
		(a, b) => parseInt(a.segmentIndex ?? '0', 10) - parseInt(b.segmentIndex ?? '0', 10)
	);

	if (segments.length === 0) {
		console.error('[createBagsForBooking] ERROR: No segments found for booking');
		return { created: 0 };
	}
	console.log(
		'[createBagsForBooking] Sorted segments:',
		segments.map((s) => s.segmentIndex).join(', ')
	);

	// Short id for URLs: booking ref (12 chars, no dashes) + label, e.g. "43ab33a6949e-A" (globally unique)
	const bookingRef = bookingId.replace(/-/g, '').slice(0, 12);
	console.log('[createBagsForBooking] bookingRef:', bookingRef);

	const bagRows: { id: string; bookingId: string; label: string }[] = [];
	for (let i = 0; i < numBags; i++) {
		const label = bagLabel(i);
		bagRows.push({
			id: `${bookingRef}-${label}`,
			bookingId,
			label
		});
	}
	console.log('[createBagsForBooking] Prepared bag rows:', bagRows.map((b) => b.id).join(', '));

	console.log('[createBagsForBooking] Inserting', bagRows.length, 'bags...');
	await dbInstance.insert(bagTable).values(bagRows);
	console.log('[createBagsForBooking] Bags inserted successfully');

	const legRows: { id: string; bagId: string; segmentId: string; status: 'at_hotel' }[] = [];
	for (const bag of bagRows) {
		for (const seg of segments) {
			legRows.push({
				id: crypto.randomUUID(),
				bagId: bag.id,
				segmentId: seg.id,
				status: 'at_hotel'
			});
		}
	}
	console.log('[createBagsForBooking] Prepared', legRows.length, 'bag legs');

	if (legRows.length > 0) {
		console.log('[createBagsForBooking] Inserting bag legs...');
		await dbInstance.insert(bagLegTable).values(legRows);
		console.log('[createBagsForBooking] Bag legs inserted successfully');
	}

	console.log('[createBagsForBooking] ===== COMPLETED =====');
	console.log('[createBagsForBooking] Created', numBags, 'bags');
	return { created: numBags };
}

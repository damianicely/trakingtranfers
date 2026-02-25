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
	const [booking] = await dbInstance
		.select({ id: bookingTable.id, numBags: bookingTable.numBags })
		.from(bookingTable)
		.where(eq(bookingTable.id, bookingId))
		.limit(1);

	if (!booking) return { created: 0 };

	const numBags = Math.max(0, parseInt(String(booking.numBags ?? '0'), 10) || 0);
	if (numBags === 0) return { created: 0 };

	const existingBags = await dbInstance
		.select({ id: bagTable.id })
		.from(bagTable)
		.where(eq(bagTable.bookingId, bookingId))
		.limit(1);
	if (existingBags.length > 0) return { created: 0 };

	const segmentRows = await dbInstance
		.select({
			id: bookingSegmentTable.id,
			segmentIndex: bookingSegmentTable.segmentIndex
		})
		.from(bookingSegmentTable)
		.where(eq(bookingSegmentTable.bookingId, bookingId));

	const segments = segmentRows.sort(
		(a, b) => parseInt(a.segmentIndex ?? '0', 10) - parseInt(b.segmentIndex ?? '0', 10)
	);

	if (segments.length === 0) return { created: 0 };

	// Short id for URLs: booking ref (12 chars, no dashes) + label, e.g. "43ab33a6949e-A" (globally unique)
	const bookingRef = bookingId.replace(/-/g, '').slice(0, 12);
	const bagRows: { id: string; bookingId: string; label: string }[] = [];
	for (let i = 0; i < numBags; i++) {
		const label = bagLabel(i);
		bagRows.push({
			id: `${bookingRef}-${label}`,
			bookingId,
			label
		});
	}

	await dbInstance.insert(bagTable).values(bagRows);

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

	if (legRows.length > 0) {
		await dbInstance.insert(bagLegTable).values(legRows);
	}

	return { created: numBags };
}

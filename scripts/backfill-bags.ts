/**
 * Backfill bag and bag_leg rows for existing paid bookings that have none.
 * Run: npx tsx scripts/backfill-bags.ts
 * Requires DATABASE_URL in .env (or environment).
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../src/lib/server/db/schema';
import { bookingTable, bagTable } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createBagsForBooking } from '../src/lib/server/bag/create-bags-for-booking';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool, { schema });

async function main() {
	const paidBookings = await db
		.select({ id: bookingTable.id })
		.from(bookingTable)
		.where(eq(bookingTable.status, 'paid'));

	let created = 0;
	for (const row of paidBookings) {
		const existing = await db.select({ id: bagTable.id }).from(bagTable).where(eq(bagTable.bookingId, row.id)).limit(1);
		if (existing.length === 0) {
			const result = await createBagsForBooking(db, row.id);
			if (result.created > 0) {
				created += result.created;
				console.log(`Booking ${row.id}: created ${result.created} bags`);
			}
		}
	}
	console.log(`Done. Total bags created: ${created}`);
	await pool.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

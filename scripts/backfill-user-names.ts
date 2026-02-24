/**
 * One-off: backfill user.first_name / user.last_name from each user's most recent
 * paid booking that has names. Run after applying drizzle/0002_add_user_first_last_name.sql.
 * Run: npx tsx scripts/backfill-user-names.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { userTable, bookingTable } from '../src/lib/server/db/schema.js';
import { eq, and, desc, isNotNull } from 'drizzle-orm';

async function main() {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		console.error('DATABASE_URL is required.');
		process.exit(1);
	}

	const pool = new pg.Pool({ connectionString: dbUrl });
	const db = drizzle(pool);

	// Get all users
	const users = await db.select({ id: userTable.id }).from(userTable);
	let updated = 0;

	for (const { id: userId } of users) {
		// Most recent paid booking for this user with non-null first/last name
		const [booking] = await db
			.select({
				firstName: bookingTable.firstName,
				lastName: bookingTable.lastName
			})
			.from(bookingTable)
			.where(
				and(
					eq(bookingTable.userId, userId),
					eq(bookingTable.status, 'paid'),
					isNotNull(bookingTable.firstName),
					isNotNull(bookingTable.lastName)
				)
			)
			.orderBy(desc(bookingTable.createdAt))
			.limit(1);

		if (booking?.firstName != null && booking?.lastName != null) {
			await db
				.update(userTable)
				.set({
					firstName: booking.firstName,
					lastName: booking.lastName
				})
				.where(eq(userTable.id, userId));
			updated++;
		}
	}

	console.log(`Backfilled names for ${updated} users (of ${users.length} total).`);
	await pool.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

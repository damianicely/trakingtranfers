/**
 * Delete a user and all rows that reference them (Postgres has no ON DELETE CASCADE
 * on these FKs). Order matters: delete child rows first, then the user.
 * Bookings are preserved by setting userId to null.
 */
import { db } from '$lib/server/db';
import {
	userTable,
	sessionTable,
	passwordResetTokenTable,
	driverStepAssignmentTable,
	driverProfile,
	ownerProfile,
	bookingTable
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function deleteUserCascade(userId: string): Promise<void> {
	await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
	await db.delete(passwordResetTokenTable).where(eq(passwordResetTokenTable.userId, userId));
	await db.delete(driverStepAssignmentTable).where(eq(driverStepAssignmentTable.driverId, userId));
	await db.delete(driverProfile).where(eq(driverProfile.userId, userId));
	await db.delete(ownerProfile).where(eq(ownerProfile.userId, userId));
	await db.update(bookingTable).set({ userId: null }).where(eq(bookingTable.userId, userId));
	await db.delete(userTable).where(eq(userTable.id, userId));
}

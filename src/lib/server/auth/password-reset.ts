import { db } from '$lib/server/db';
import { passwordResetTokenTable, userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import crypto from 'node:crypto';

/**
 * Creates a password reset token for a user
 * @param userId - The user ID to create the token for
 * @param expiresInHours - How many hours until the token expires (default: 24)
 * @param origin - The origin URL for constructing the reset link (default: localhost:5173)
 * @returns Object with tokenId and resetUrl
 */
export async function createPasswordResetToken(
	userId: string,
	expiresInHours: number = 24,
	origin: string = 'http://localhost:5173'
): Promise<{ tokenId: string; resetUrl: string }> {
	console.log('[createPasswordResetToken] ===== START =====');
	console.log('[createPasswordResetToken] userId:', userId);
	console.log('[createPasswordResetToken] expiresInHours:', expiresInHours);
	console.log('[createPasswordResetToken] origin:', origin);

	const tokenId = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * expiresInHours);

	console.log('[createPasswordResetToken] Generated tokenId:', tokenId);
	console.log('[createPasswordResetToken] Token expires at:', expiresAt.toISOString());

	console.log('[createPasswordResetToken] Inserting token into database...');
	await db.insert(passwordResetTokenTable).values({
		id: tokenId,
		userId,
		expiresAt
	});
	console.log('[createPasswordResetToken] Token inserted successfully');

	const resetUrl = `${origin}/reset-password/${tokenId}`;
	console.log('[createPasswordResetToken] ===== COMPLETED =====');
	console.log('[createPasswordResetToken] resetUrl:', resetUrl);

	return { tokenId, resetUrl };
}

/**
 * Validates a password reset token
 * @param tokenId - The token ID to validate
 * @returns Object with valid flag, userId if valid, and optional error message
 */
export async function validatePasswordResetToken(
	tokenId: string
): Promise<{ valid: boolean; userId: string | null; error?: string }> {
	console.log('[validatePasswordResetToken] ===== START =====');
	console.log('[validatePasswordResetToken] tokenId:', tokenId);

	if (!tokenId) {
		console.error('[validatePasswordResetToken] ERROR: Token is required');
		return { valid: false, userId: null, error: 'Token is required' };
	}

	console.log('[validatePasswordResetToken] Looking up token in database...');
	const [resetToken] = await db
		.select()
		.from(passwordResetTokenTable)
		.where(eq(passwordResetTokenTable.id, tokenId));

	if (!resetToken) {
		console.error('[validatePasswordResetToken] ERROR: Token not found');
		return { valid: false, userId: null, error: 'Token not found' };
	}
	console.log('[validatePasswordResetToken] Token found, userId:', resetToken.userId);

	if (resetToken.expiresAt < new Date()) {
		console.error('[validatePasswordResetToken] ERROR: Token has expired');
		console.error('  Expires at:', resetToken.expiresAt.toISOString());
		console.error('  Current time:', new Date().toISOString());
		return { valid: false, userId: null, error: 'Token has expired' };
	}

	console.log('[validatePasswordResetToken] ===== COMPLETED =====');
	console.log('[validatePasswordResetToken] Token is valid');
	return { valid: true, userId: resetToken.userId };
}

/**
 * Updates a user's password and deletes the reset token
 * @param userId - The user ID to update
 * @param newPassword - The new password (will be validated and hashed)
 * @returns Object with success flag and optional error message
 */
export async function updateUserPassword(
	userId: string,
	newPassword: string
): Promise<{ success: boolean; error?: string }> {
	console.log('[updateUserPassword] ===== START =====');
	console.log('[updateUserPassword] userId:', userId);

	// Validate password
	if (!newPassword || newPassword.length < 6) {
		console.error('[updateUserPassword] ERROR: Password must be at least 6 characters');
		return { success: false, error: 'Password must be at least 6 characters long' };
	}
	console.log('[updateUserPassword] Password validation passed');

	// Hash the new password
	console.log('[updateUserPassword] Hashing password...');
	const passwordHash = await hash(newPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	console.log('[updateUserPassword] Password hashed successfully');

	// Update the user's password
	console.log('[updateUserPassword] Updating user password in database...');
	await db.update(userTable).set({ passwordHash }).where(eq(userTable.id, userId));
	console.log('[updateUserPassword] Password updated successfully');

	// Delete all reset tokens for this user (cleanup)
	console.log('[updateUserPassword] Cleaning up old reset tokens...');
	await db.delete(passwordResetTokenTable).where(eq(passwordResetTokenTable.userId, userId));
	console.log('[updateUserPassword] Old tokens deleted');

	console.log('[updateUserPassword] ===== COMPLETED =====');
	return { success: true };
}

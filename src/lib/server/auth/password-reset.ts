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
	const tokenId = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * expiresInHours);

	await db.insert(passwordResetTokenTable).values({
		id: tokenId,
		userId,
		expiresAt
	});

	const resetUrl = `${origin}/reset-password/${tokenId}`;

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
	if (!tokenId) {
		return { valid: false, userId: null, error: 'Token is required' };
	}

	const [resetToken] = await db
		.select()
		.from(passwordResetTokenTable)
		.where(eq(passwordResetTokenTable.id, tokenId));

	if (!resetToken) {
		return { valid: false, userId: null, error: 'Token not found' };
	}

	if (resetToken.expiresAt < new Date()) {
		return { valid: false, userId: null, error: 'Token has expired' };
	}

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
	// Validate password
	if (!newPassword || newPassword.length < 6) {
		return { success: false, error: 'Password must be at least 6 characters long' };
	}

	// Hash the new password
	const passwordHash = await hash(newPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	// Update the user's password
	await db.update(userTable).set({ passwordHash }).where(eq(userTable.id, userId));

	// Delete all reset tokens for this user (cleanup)
	await db.delete(passwordResetTokenTable).where(eq(passwordResetTokenTable.userId, userId));

	return { success: true };
}

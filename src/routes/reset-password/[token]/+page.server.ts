import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { passwordResetTokenTable, userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';

export const load: PageServerLoad = async ({ params }) => {
	const token = params.token;

	if (!token) {
		return {
			tokenValid: false
		};
	}

	const [resetToken] = await db
		.select()
		.from(passwordResetTokenTable)
		.where(eq(passwordResetTokenTable.id, token));

	if (!resetToken || resetToken.expiresAt < new Date()) {
		return {
			tokenValid: false
		};
	}

	return {
		tokenValid: true
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const token = params.token;

		if (!token) {
			return fail(400, { message: 'Invalid or missing token' });
		}

		const formData = await request.formData();
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');

		if (typeof password !== 'string' || password.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters long' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match' });
		}

		const [resetToken] = await db
			.select()
			.from(passwordResetTokenTable)
			.where(eq(passwordResetTokenTable.id, token));

		if (!resetToken || resetToken.expiresAt < new Date()) {
			return fail(400, { message: 'This link is invalid or has expired' });
		}

		// Hash the new password
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		// Update the user's password
		await db
			.update(userTable)
			.set({ passwordHash })
			.where(eq(userTable.id, resetToken.userId));

		// Delete the token so it can't be reused
		await db
			.delete(passwordResetTokenTable)
			.where(eq(passwordResetTokenTable.id, token));

		// Redirect to login page
		throw redirect(302, '/login');
	}
};


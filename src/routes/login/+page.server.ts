import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable, sessionTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import crypto from 'node:crypto';
import { createPasswordResetToken } from '$lib/server/auth/password-reset';

export const actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;
		const redirectTo = (formData.get('redirectTo') as string)?.trim() || '';

		const [user] = await db.select().from(userTable).where(eq(userTable.username, username.toLowerCase()));

		if (!user || !(await verify(user.passwordHash, password))) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const sessionId = crypto.randomBytes(20).toString('hex');
		await db.insert(sessionTable).values({
			id: sessionId,
			userId: user.id,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
		});

		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		// Default redirect by role when no valid redirectTo is provided
		const defaultByRole =
			user.role === 'admin' || user.role === 'owner'
				? '/admin'
				: user.role === 'driver'
					? '/driver'
					: '/account';
		// Same-origin path only: must start with / and contain no protocol-relative or double slash
		const target =
			redirectTo && redirectTo.startsWith('/') && !redirectTo.includes('//')
				? redirectTo
				: defaultByRole;

		// Modal sends Accept: application/json; we return JSON + Set-Cookie so the client can reload to that URL.
		const wantsJson = request.headers.get('Accept')?.includes('application/json');
		console.log('[login action] wantsJson=', wantsJson, 'target=', target, 'Accept=', request.headers.get('Accept'));
		if (wantsJson) {
			console.log('[login action] returning { success: true, redirectTo:', target, '}');
			return { success: true, redirectTo: target };
		}
		throw redirect(302, target);
	},
	requestPasswordReset: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;

		if (!email || typeof email !== 'string') {
			return fail(400, { message: 'Email is required' });
		}

		const username = email.toLowerCase();

		// Look up user by email (username is email in your system)
		const [user] = await db.select().from(userTable).where(eq(userTable.username, username));

		// Always return success (don't reveal if email exists)
		// But only create token if user exists
		if (user) {
			try {
				const { resetUrl } = await createPasswordResetToken(user.id, 24, url.origin);

				// For now, "send" the email by logging the reset link
				console.log(`Password reset link for ${username}: ${resetUrl}`);
			} catch (error) {
				console.error('Error creating password reset token:', error);
				// Still return success to user (don't reveal error)
			}
		}

		// Always return success message (security: don't reveal if email exists)
		return {
			success: true,
			message: 'If that email exists, a password reset link has been sent. Check your console for the link (email integration pending).'
		};
	}
};
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createPasswordResetToken } from '$lib/server/auth/password-reset';

/**
 * POST /api/debug/create-reset-token
 * Creates a password reset token for a user (for debugging purposes)
 * Body: { email: string }
 */
export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const body = await request.json();
		const email = body.email?.toLowerCase()?.trim();

		if (!email) {
			return new Response(JSON.stringify({ error: 'Email is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Find user
		const users = await db.select().from(userTable).where(eq(userTable.username, email));

		if (users.length === 0) {
			return new Response(JSON.stringify({ error: 'User not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const user = users[0];

		// Create reset token
		const { resetUrl } = await createPasswordResetToken(user.id, 24, url.origin);

		return new Response(
			JSON.stringify({
				success: true,
				email: user.username,
				userId: user.id,
				resetUrl
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error creating reset token:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable, sessionTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import crypto from 'node:crypto';

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

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

		throw redirect(302, '/dashboard');
	}
};
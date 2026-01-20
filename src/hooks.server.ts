import { db } from '$lib/server/db';
import { sessionTable, userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	// 1. If no cookie, user is guest
	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	// 2. Validate session in Postgres (Laravel: Auth::user())
	const [result] = await db
		.select({ user: userTable, session: sessionTable })
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.where(eq(sessionTable.id, sessionId));

	// 3. Check if session exists and isn't expired
	if (!result || result.session.expiresAt < new Date()) {
		if (result) await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
		event.cookies.delete('session', { path: '/' });
		event.locals.user = null;
	} else {
		// 4. Set user data to 'locals' for use in any +page.server.ts
		event.locals.user = { id: result.user.id, username: result.user.username };
	}

	return resolve(event);
};

import { db } from '$lib/server/db';
import { sessionTable, userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

// === LOGGING TEST #1: Top-level module log ===
// This runs when the server module is first imported
console.log('[TEST 1] Hello World from hooks.server.ts - Module loaded!');
console.log('[TEST 1] Timestamp:', new Date().toISOString());

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');

	// 1. If no cookie, user is guest
	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	// 2. Validate session in Postgres (Laravel: Auth::user())
	let result:
		| { user: { id: string; username: string; role: string }; session: { expiresAt: Date } }
		| undefined;
	try {
		[result] = await db
			.select({ user: userTable, session: sessionTable })
			.from(sessionTable)
			.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
			.where(eq(sessionTable.id, sessionId));
	} catch (err) {
		console.error('[hooks.server] Session lookup failed:', err);
		event.cookies.delete('session', { path: '/' });
		event.locals.user = null;
		return resolve(event);
	}

	// 3. Check if session exists and isn't expired
	if (!result || result.session.expiresAt < new Date()) {
		if (result) {
			try {
				await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
			} catch (_) {
				// ignore cleanup failure
			}
		}
		event.cookies.delete('session', { path: '/' });
		event.locals.user = null;
	} else {
		// 4. Set user data to 'locals' for use in any +page.server.ts
		event.locals.user = {
			id: result.user.id,
			username: result.user.username,
			role: result.user.role // Now available for route guarding!
		};
	}

	return resolve(event);
};

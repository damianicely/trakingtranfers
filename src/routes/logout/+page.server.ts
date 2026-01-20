import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessionTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const actions = {
	default: async ({ cookies }) => {
		const sessionId = cookies.get('session');

		// Delete session from database if it exists
		if (sessionId) {
			await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
		}

		// Clear the session cookie
		cookies.delete('session', { path: '/' });

		// Redirect to login page
		throw redirect(302, '/login');
	}
};

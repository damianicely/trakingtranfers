import { db } from '$lib/server/db';
import { userTable, sessionTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';

export const actions = {
    default: async ({ request, cookies }) => {
        const formData = await request.formData();
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        // 1. Find User (Laravel: User::where('username', $username)->first())
        const [existingUser] = await db.select().from(userTable).where(eq(userTable.username, username));

        if (!existingUser) {
            return fail(400, { message: 'Incorrect username or password' });
        }

        // 2. Verify Hash
        const validPassword = await new Argon2id().verify(existingUser.passwordHash, password);
        if (!validPassword) {
            return fail(400, { message: 'Incorrect username or password' });
        }

        // 3. Create Session (Simplified)
        const sessionId = generateIdFromEntropySize(25);
        await db.insert(sessionTable).values({
            id: sessionId,
            userId: existingUser.id,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
        });

        // 4. Set Cookie
        cookies.set('session', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30
        });

        throw redirect(302, '/dashboard');
    }
};
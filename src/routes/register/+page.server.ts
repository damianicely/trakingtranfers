import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { Argon2id } from 'oslo/password';
import { generateIdFromEntropySize } from 'oslo/crypto';

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');

        // 1. Basic Validation (Laravel-style validation logic)
        if (typeof username !== 'string' || username.length < 3) {
            return fail(400, { message: 'Invalid username' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return fail(400, { message: 'Password too short' });
        }

        // 2. Hash Password
        const passwordHash = await new Argon2id().hash(password);
        const userId = generateIdFromEntropySize(10); // Generate a random string ID

        try {
            // 3. Insert using Drizzle (The "Eloquent" equivalent)
            await db.insert(userTable).values({
                id: userId,
                username,
                passwordHash
            });
        } catch (e) {
            // Handle Postgres unique constraint error (username taken)
            return fail(500, { message: 'Username already exists' });
        }

        throw redirect(302, '/login');
    }
};
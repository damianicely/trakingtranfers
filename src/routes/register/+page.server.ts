import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import crypto from 'node:crypto';

export const actions = {
    default: async ({ request }) => {
        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');

        // Validation
        if (typeof username !== 'string' || username.length < 3) {
            return fail(400, { message: 'Username too short' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return fail(400, { message: 'Password too short' });
        }

        // 1. Hash the password
        const passwordHash = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });

        // 2. Generate a random ID using Node built-in crypto
        const userId = crypto.randomBytes(15).toString('hex');

        try {
            // 3. Insert into Postgres
            await db.insert(userTable).values({
                id: userId,
                username: username.toLowerCase(),
                passwordHash
            });
        } catch (e: any) {
            // Log the actual error to see what's happening
            console.error('Database insert error:', e);
            console.error('Error message:', e?.message);
            console.error('Error code:', e?.code);
            console.error('Error detail:', e?.detail);
            console.error('Full error:', JSON.stringify(e, null, 2));
            
            // Check if it's a unique constraint violation (PostgreSQL error code 23505)
            if (e?.code === '23505') {
            return fail(400, { message: 'Username already taken' });
            }
            
            // For other errors, return a generic message with error details in dev
            const errorMessage = process.env.NODE_ENV === 'development' 
                ? `Database error: ${e?.message || 'Unknown error'}` 
                : 'An error occurred during registration. Please try again.';
            
            return fail(500, { message: errorMessage });
        }

        throw redirect(302, '/login');
    }
};
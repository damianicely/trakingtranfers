import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
    // 1. Check if the session exists (populated by your hook)
    if (!locals.user) {
        // 2. Redirect to login if they are a guest
        throw redirect(302, '/login');
    }

    // 3. If they are logged in, return data to the page
    return {
        user: locals.user
    };
};
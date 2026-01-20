import { pool } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // This executes on the Ubuntu server (via the tunnel)
    const result = await pool.query('SELECT NOW()');
    
    return {
        serverTime: result.rows[0].now
    };
};
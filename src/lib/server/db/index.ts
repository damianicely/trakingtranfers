import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

// Export the pool for raw SQL queries (e.g., in test routes)
export const pool = new pg.Pool({
  connectionString: DATABASE_URL,
});

// Export the Drizzle instance for ORM queries
export const db = drizzle(pool, { schema });
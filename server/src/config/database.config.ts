import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from './env.config.js';
import * as schema from '../db/schema/index.js';

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
export { pool };

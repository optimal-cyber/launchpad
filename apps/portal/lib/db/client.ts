/**
 * PostgreSQL Database Client
 * Connection pool for the Optimal Platform database
 */

import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

// Database configuration from environment
const dbConfig: PoolConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'optimal_platform',
  user: process.env.DATABASE_USER || 'optimal_user',
  password: process.env.DATABASE_PASSWORD || 'dev_password_123',

  // Connection pool settings
  max: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,

  // SSL for production
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
  } : undefined,
};

// Singleton pool instance
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);

    // Error handler for the pool
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    // Log connection info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] Pool created: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    }
  }

  return pool;
}

/**
 * Execute a query with parameters
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = getPool();
  const start = Date.now();

  try {
    const result = await client.query<T>(text, params);

    // Log slow queries in development
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return the first row
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 */
export async function queryAll<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  callback: (client: Pool) => Promise<T>
): Promise<T> {
  const client = getPool();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Check database connectivity
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now');
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Gracefully close the pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Pool closed');
  }
}

// Export the Pool type for use in repositories
export type { Pool, QueryResult };

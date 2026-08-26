import { neon } from '@neondatabase/serverless';

/**
 * Creates a PostgreSQL client for an individual company database.
 * The MASTER database stores the mapping between company and database URL.
 * Never expose DATABASE_URL values to the browser.
 */
export function tenantSql(databaseUrl: string) {
  if (!databaseUrl) {
    throw new Error('Database da empresa não configurado.');
  }

  return neon(databaseUrl);
}

export function validateTenantDatabaseUrl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    return url.protocol === 'postgresql:' || url.protocol === 'postgres:';
  } catch {
    return false;
  }
}

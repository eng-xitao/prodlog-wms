import { neon } from '@neondatabase/serverless';

// Conexão direta e serverless com a Neon.tech
export const sql = neon(process.env.DATABASE_URL!);
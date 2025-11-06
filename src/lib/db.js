// SERVER-SIDE ONLY DATABASE CONNECTION
// ⚠️ This file should NEVER be imported in src/ directory
// Only import in api/ directory (Vercel serverless functions)

import { neon } from '@neondatabase/serverless';

// Server-side environment variables (NO VITE_ prefix!)
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL not found in server environment variables');
}

// Export sql for use in API routes only
export const sql = neon(databaseUrl);

// Also export as 'query' for compatibility with some API files
export const query = sql;

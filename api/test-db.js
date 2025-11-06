// Minimal test endpoint to debug SQL issues
import { sql } from './lib/db.js';

export default async function handler(req, res) {
  try {
    console.log('[Test DB] Starting test query...');

    // Test 1: Simple query without parameters
    const test1 = await sql`SELECT 1 as test`;
    console.log('[Test DB] Test 1 passed:', test1);

    // Test 2: Query archives table
    const test2 = await sql`SELECT COUNT(*) FROM archives`;
    console.log('[Test DB] Test 2 passed:', test2);

    // Test 3: Full archives query
    const test3 = await sql`
      SELECT id, term, academic_year, archived_date, archived_by
      FROM archives
      ORDER BY archived_date DESC
    `;
    console.log('[Test DB] Test 3 passed, found', test3.length, 'archives');

    return res.json({
      status: 'success',
      tests: {
        test1: 'passed',
        test2: 'passed',
        test3: 'passed',
        archiveCount: test3.length
      }
    });
  } catch (error) {
    console.error('[Test DB] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
}

// Migration to add vacation_date and reopening_date to remarks table
import { sql } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    console.log('[Add Vacation Dates] Starting migration...');

    // Add vacation_date column
    console.log('[Add Vacation Dates] Adding vacation_date column...');
    await sql`
      ALTER TABLE remarks
      ADD COLUMN IF NOT EXISTS vacation_date VARCHAR(50)
    `;

    // Add reopening_date column
    console.log('[Add Vacation Dates] Adding reopening_date column...');
    await sql`
      ALTER TABLE remarks
      ADD COLUMN IF NOT EXISTS reopening_date VARCHAR(50)
    `;

    // Verify the changes
    console.log('[Add Vacation Dates] Verifying changes...');
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'remarks'
      ORDER BY column_name
    `;

    return res.json({
      status: 'success',
      message: 'Vacation date columns added successfully',
      columns: columns
    });
  } catch (error) {
    console.error('[Add Vacation Dates] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
}

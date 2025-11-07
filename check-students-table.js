import { sql } from './api/lib/db.js';

try {
  console.log('Checking students table structure...\n');

  const columns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'students'
    ORDER BY ordinal_position
  `;

  console.log('Students table columns:');
  console.log(JSON.stringify(columns, null, 2));

  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

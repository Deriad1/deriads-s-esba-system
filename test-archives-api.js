import { sql } from './api/lib/db.js';

async function testArchivesQuery() {
  try {
    console.log('Testing archives query...\n');

    // Test 1: Simple query
    console.log('Test 1: Simple SELECT');
    const test1 = await sql`
      SELECT * FROM archives
      ORDER BY archived_date DESC
    `;
    console.log('✅ Success! Found', test1.length, 'archives');
    console.log(test1);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

testArchivesQuery();

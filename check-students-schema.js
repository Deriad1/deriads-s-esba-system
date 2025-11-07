import { sql } from './api/lib/db.js';

async function checkStudentsSchema() {
  try {
    console.log('🔍 Checking students table schema...\n');

    // Get table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'students'
      ORDER BY ordinal_position;
    `;

    console.log('📊 Students table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n📝 Sample student records:');
    const samples = await sql`
      SELECT id, id_number, first_name, last_name, class_name
      FROM students
      LIMIT 5;
    `;
    console.table(samples);

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkStudentsSchema();

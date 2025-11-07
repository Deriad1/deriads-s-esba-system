import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

async function checkColumns() {
  try {
    console.log('\n📊 Checking MARKS table structure...\n');
    const marksColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'marks'
      ORDER BY ordinal_position
    `;
    console.log('MARKS table columns:');
    marksColumns.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    console.log('\n📊 Checking STUDENT_SCORES table structure...\n');
    const scoresColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'student_scores'
      ORDER BY ordinal_position
    `;
    console.log('STUDENT_SCORES table columns:');
    scoresColumns.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));

    // Check which table has data
    const marksCount = await sql`SELECT COUNT(*) as count FROM marks`;
    const scoresCount = await sql`SELECT COUNT(*) as count FROM student_scores`;

    console.log(`\n📈 Data counts:`);
    console.log(`  - marks table: ${marksCount[0].count} rows`);
    console.log(`  - student_scores table: ${scoresCount[0].count} rows`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkColumns();

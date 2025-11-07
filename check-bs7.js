import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = neon(databaseUrl);

async function checkBS7Students() {
  try {
    console.log('🔍 Checking BS7 students...\n');

    // Check BS7 students count
    const count = await sql`SELECT COUNT(*) as count FROM students WHERE class_name = 'BS7'`;
    console.log(`Total BS7 students: ${count[0].count}`);

    // Get all BS7 students
    const students = await sql`
      SELECT id, id_number, first_name, last_name, class_name, gender
      FROM students
      WHERE class_name = 'BS7'
      ORDER BY last_name, first_name
    `;

    console.log('\nAll BS7 students:');
    console.table(students);

    // Check if there are any issues with the data
    console.log('\nChecking for data issues:');
    const nullNames = students.filter(s => !s.first_name || !s.last_name);
    if (nullNames.length > 0) {
      console.log(`⚠️ Found ${nullNames.length} students with null names`);
    }

    const duplicateIds = students.filter((s, i, arr) =>
      arr.findIndex(x => x.id_number === s.id_number) !== i
    );
    if (duplicateIds.length > 0) {
      console.log(`⚠️ Found ${duplicateIds.length} students with duplicate ID numbers`);
    }

    if (nullNames.length === 0 && duplicateIds.length === 0) {
      console.log('✅ No data issues found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBS7Students();

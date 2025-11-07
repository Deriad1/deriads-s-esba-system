import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = neon(databaseUrl);

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n');

    // Check teachers
    const teachers = await sql`SELECT COUNT(*) as count FROM teachers`;
    console.log(`Teachers: ${teachers[0].count} records`);

    // Check students
    const students = await sql`SELECT COUNT(*) as count FROM students`;
    console.log(`Students: ${students[0].count} records`);

    // Show sample teachers
    if (teachers[0].count > 0) {
      const sampleTeachers = await sql`
        SELECT id, first_name, last_name, email, teacher_primary_role
        FROM teachers
        ORDER BY id
        LIMIT 5
      `;
      console.log('\nSample teachers:');
      console.table(sampleTeachers);
    }

    // Show sample students
    if (students[0].count > 0) {
      const sampleStudents = await sql`
        SELECT id, first_name, last_name, class_name
        FROM students
        ORDER BY id
        LIMIT 5
      `;
      console.log('\nSample students:');
      console.table(sampleStudents);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();

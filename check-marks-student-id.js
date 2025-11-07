import dotenv from 'dotenv';
dotenv.config();

import { sql } from './api/lib/db.js';

async function checkTypes() {
  console.log('Checking marks table structure...\n');

  // Check marks table columns
  const marksColumns = await sql`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'marks' AND column_name IN ('student_id', 'id')
    ORDER BY ordinal_position
  `;

  console.log('Marks table columns:');
  console.log(JSON.stringify(marksColumns, null, 2));

  // Check students table columns
  const studentsColumns = await sql`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'students' AND column_name IN ('id', 'id_number')
    ORDER BY ordinal_position
  `;

  console.log('\nStudents table columns:');
  console.log(JSON.stringify(studentsColumns, null, 2));

  // Check a sample from marks table
  const sampleMarks = await sql`
    SELECT student_id, id, class_name, subject
    FROM marks
    LIMIT 3
  `;

  console.log('\nSample marks records:');
  console.log(JSON.stringify(sampleMarks, null, 2));

  process.exit(0);
}

checkTypes().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

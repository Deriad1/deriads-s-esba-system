// Reassign students from BS10, BS11, BS12 to BS9
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function reassignStudents() {
  console.log('🔄 Starting student reassignment...\n');

  try {
    // Get students before update
    console.log('📋 Students in BS10, BS11, BS12 before update:');
    const beforeUpdate = await sql`
      SELECT id, id_number, first_name, last_name, class_name
      FROM students
      WHERE class_name IN ('BS10', 'BS11', 'BS12')
      ORDER BY class_name, last_name
    `;

    if (beforeUpdate.length === 0) {
      console.log('✅ No students found in BS10, BS11, or BS12. Nothing to update!');
      return;
    }

    console.table(beforeUpdate);
    console.log(`\nFound ${beforeUpdate.length} student(s) to reassign\n`);

    // Update BS10 students
    const bs10Result = await sql`
      UPDATE students
      SET class_name = 'BS9', updated_at = NOW()
      WHERE class_name = 'BS10'
      RETURNING id, id_number, first_name, last_name, class_name
    `;
    console.log(`✅ Updated ${bs10Result.length} student(s) from BS10 to BS9`);

    // Update BS11 students
    const bs11Result = await sql`
      UPDATE students
      SET class_name = 'BS9', updated_at = NOW()
      WHERE class_name = 'BS11'
      RETURNING id, id_number, first_name, last_name, class_name
    `;
    console.log(`✅ Updated ${bs11Result.length} student(s) from BS11 to BS9`);

    // Update BS12 students
    const bs12Result = await sql`
      UPDATE students
      SET class_name = 'BS9', updated_at = NOW()
      WHERE class_name = 'BS12'
      RETURNING id, id_number, first_name, last_name, class_name
    `;
    console.log(`✅ Updated ${bs12Result.length} student(s) from BS12 to BS9`);

    // Verify no students remain in BS10, BS11, BS12
    console.log('\n📋 Verification - Students in BS10, BS11, BS12 after update:');
    const afterUpdate = await sql`
      SELECT id, id_number, first_name, last_name, class_name
      FROM students
      WHERE class_name IN ('BS10', 'BS11', 'BS12')
      ORDER BY class_name, last_name
    `;

    if (afterUpdate.length === 0) {
      console.log('✅ Success! No students remain in BS10, BS11, or BS12');
      console.log('✅ These classes will now disappear from your system\n');
    } else {
      console.table(afterUpdate);
      console.log('⚠️  Warning: Some students still in BS10, BS11, or BS12');
    }

    // Show all BS9 students now
    console.log('\n📋 All students in BS9 (including newly reassigned):');
    const bs9Students = await sql`
      SELECT id, id_number, first_name, last_name, class_name
      FROM students
      WHERE class_name = 'BS9'
      ORDER BY last_name
    `;
    console.table(bs9Students);
    console.log(`\nTotal students in BS9: ${bs9Students.length}\n`);

    console.log('🎉 Reassignment complete!\n');

  } catch (error) {
    console.error('❌ Error reassigning students:', error);
    throw error;
  }
}

// Run the script
reassignStudents()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.VITE_POSTGRES_URL);

async function testDatabase() {
  console.log('\n📊 Testing Database Connection & Schema\n');
  console.log('=========================================');

  try {
    // Test 1: Database connection
    console.log('\n1️⃣  Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!');

    // Test 2: Check teachers table
    console.log('\n2️⃣  Checking teachers table...');
    const teachers = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'teachers'
      ORDER BY ordinal_position
    `;
    console.log(`   ✅ Teachers table exists with ${teachers.length} columns:`);
    teachers.forEach(col => {
      console.log(`      - ${col.column_name} (${col.data_type})`);
    });

    // Test 3: Check students table
    console.log('\n3️⃣  Checking students table...');
    const studentsTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'students'
      )
    `;

    if (studentsTableCheck[0].exists) {
      const students = await sql`SELECT COUNT(*) as count FROM students`;
      console.log(`   ✅ Students table exists with ${students[0].count} records`);
    } else {
      console.log('   ⚠️  Students table does not exist');
    }

    // Test 4: Check student_scores table
    console.log('\n4️⃣  Checking student_scores table...');
    const scoresTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'student_scores'
      )
    `;

    if (scoresTableCheck[0].exists) {
      const scores = await sql`SELECT COUNT(*) as count FROM student_scores`;
      console.log(`   ✅ Student_scores table exists with ${scores[0].count} records`);
    } else {
      console.log('   ⚠️  Student_scores table does not exist');
    }

    // Test 5: Check data in teachers table
    console.log('\n5️⃣  Checking teacher accounts...');
    const teacherAccounts = await sql`
      SELECT email, first_name, last_name, teacher_primary_role, all_roles
      FROM teachers
      ORDER BY id
    `;
    console.log(`   ✅ Found ${teacherAccounts.length} teacher accounts:`);
    teacherAccounts.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.first_name} ${t.last_name} (${t.email})`);
      console.log(`         Role: ${t.teacher_primary_role} | All Roles: ${t.all_roles.join(', ')}`);
    });

    console.log('\n=========================================');
    console.log('🎉 Database Test Complete!\n');

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error(error);
  }
}

testDatabase();

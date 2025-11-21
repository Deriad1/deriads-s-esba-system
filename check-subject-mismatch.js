import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function checkSubjectMismatch() {
  console.log('\n🔍 CHECKING SUBJECT DATA IN MARKS\n');
  console.log('='.repeat(60));

  try {
    // Get all marks with their subjects
    const marks = await sql`
      SELECT
        m.id,
        m.student_id,
        st.first_name,
        st.last_name,
        st.class_name,
        m.subject,
        m.term,
        m.test1,
        m.test2,
        m.test3,
        m.test4,
        m.exam,
        m.total,
        m.created_at
      FROM marks m
      JOIN students st ON m.student_id = st.id
      ORDER BY st.class_name, st.last_name, m.subject
    `;

    console.log(`\nTotal marks records: ${marks.length}\n`);

    // Group by class and subject
    const grouped = {};
    marks.forEach(mark => {
      const key = `${mark.class_name} - ${mark.subject}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(mark);
    });

    console.log('Marks by Class & Subject:\n');
    Object.keys(grouped).sort().forEach(key => {
      const records = grouped[key];
      console.log(`${key}: ${records.length} students`);

      // Show first 3 students as sample
      records.slice(0, 3).forEach(mark => {
        console.log(`  - ${mark.first_name} ${mark.last_name}: Test1=${mark.test1}, Test2=${mark.test2}, Test3=${mark.test3}, Test4=${mark.test4}, Exam=${mark.exam}`);
      });

      if (records.length > 3) {
        console.log(`  ... and ${records.length - 3} more`);
      }
      console.log('');
    });

    // Check for duplicate subjects for same student
    console.log('='.repeat(60));
    console.log('\n🔍 Checking for duplicate subject entries...\n');

    const duplicates = await sql`
      SELECT
        student_id,
        st.first_name,
        st.last_name,
        st.class_name,
        subject,
        term,
        COUNT(*) as count
      FROM marks m
      JOIN students st ON m.student_id = st.id
      GROUP BY student_id, st.first_name, st.last_name, st.class_name, subject, term
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate entries:\n`);
      duplicates.forEach(dup => {
        console.log(`${dup.first_name} ${dup.last_name} (${dup.class_name})`);
        console.log(`  Subject: ${dup.subject}, Term: ${dup.term}`);
        console.log(`  Duplicates: ${dup.count} records\n`);
      });
    } else {
      console.log('✅ No duplicate entries found\n');
    }

    console.log('='.repeat(60));
    console.log('\n✅ Check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkSubjectMismatch();

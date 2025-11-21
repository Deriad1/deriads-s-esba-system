import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function findDuplicates() {
  console.log('\n🔍 FINDING DUPLICATE MARKS\n');

  const duplicates = await sql`
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
    WHERE (m.student_id, m.subject, m.term) IN (
      SELECT student_id, subject, term
      FROM marks
      GROUP BY student_id, subject, term
      HAVING COUNT(*) > 1
    )
    ORDER BY m.student_id, m.subject, m.term, m.created_at
  `;

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!\n');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate records:\n`);

  let currentKey = '';
  let groupNum = 1;

  duplicates.forEach(d => {
    const key = `${d.student_id}-${d.subject}-${d.term}`;
    if (key !== currentKey) {
      console.log(`\n${groupNum}. ${d.first_name} ${d.last_name} (${d.class_name}) - ${d.subject} - ${d.term}`);
      currentKey = key;
      groupNum++;
    }
    console.log(`   ID: ${d.id} | Test1=${d.test1}, Test2=${d.test2}, Test3=${d.test3}, Test4=${d.test4}, Exam=${d.exam} | Created: ${d.created_at.toISOString()}`);
  });

  console.log('\n');
}

findDuplicates();

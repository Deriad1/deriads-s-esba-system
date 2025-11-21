import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function checkBS5Marks() {
    try {
        console.log('🔍 Checking marks for BS5...\n');

        // Get all marks for BS5
        const bs5Marks = await sql`
      SELECT 
        m.subject,
        COUNT(*) as student_count,
        MAX(m.created_at) as last_saved,
        m.term
      FROM marks m
      WHERE m.class_name = 'BS5'
      GROUP BY m.subject, m.term
      ORDER BY m.subject, m.term
    `;

        if (bs5Marks.length === 0) {
            console.log('❌ No marks found for BS5\n');
        } else {
            console.log('📊 BS5 Marks by Subject and Term:\n');
            bs5Marks.forEach(row => {
                console.log(`  ${row.subject} (${row.term}): ${row.student_count} students - Last saved: ${new Date(row.last_saved).toLocaleString()}`);
            });
        }

        console.log('\n🔍 Detailed BS5 marks:\n');
        const detailedMarks = await sql`
      SELECT 
        m.subject,
        m.term,
        s.id_number,
        s.first_name,
        s.last_name,
        m.test1,
        m.test2,
        m.test3,
        m.test4,
        m.exam,
        m.total,
        m.created_at
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE m.class_name = 'BS5'
      ORDER BY m.subject, s.last_name
    `;

        detailedMarks.forEach(mark => {
            console.log(`${mark.subject} | ${mark.term} | ${mark.first_name} ${mark.last_name} (${mark.id_number})`);
            console.log(`  T1:${mark.test1} T2:${mark.test2} T3:${mark.test3} T4:${mark.test4} Exam:${mark.exam} Total:${mark.total}`);
            console.log(`  Saved: ${new Date(mark.created_at).toLocaleString()}\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkBS5Marks();

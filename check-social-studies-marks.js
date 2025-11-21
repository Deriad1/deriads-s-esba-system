import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function checkSocialStudiesMarks() {
    try {
        console.log('🔍 Checking marks for Social Studies...\n');

        // Get all marks for Social Studies
        const marks = await sql`
      SELECT m.*, s.first_name, s.last_name, s.id_number
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE m.subject ILIKE '%social%'
      ORDER BY m.created_at DESC
      LIMIT 10
    `;

        if (marks.length === 0) {
            console.log('❌ No marks found for Social Studies');
            console.log('\nLet me check what subjects exist in the database...\n');

            const allSubjects = await sql`
        SELECT DISTINCT subject, COUNT(*) as count
        FROM marks
        GROUP BY subject
        ORDER BY subject
      `;

            console.log('📊 Subjects in database:');
            allSubjects.forEach(s => {
                console.log(`  - ${s.subject}: ${s.count} marks`);
            });
        } else {
            console.log(`✅ Found ${marks.length} Social Studies marks:\n`);
            marks.forEach(mark => {
                console.log(`Student: ${mark.first_name} ${mark.last_name} (${mark.id_number})`);
                console.log(`Subject: "${mark.subject}"`);
                console.log(`Term: ${mark.term}`);
                console.log(`Scores: T1=${mark.test1}, T2=${mark.test2}, T3=${mark.test3}, T4=${mark.test4}, Exam=${mark.exam}`);
                console.log(`Total: ${mark.total}`);
                console.log(`Created: ${mark.created_at}`);
                console.log('---');
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkSocialStudiesMarks();

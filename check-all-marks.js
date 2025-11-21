import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function checkAllMarks() {
    try {
        console.log('🔍 Checking all marks in database...\n');

        // Get all distinct subjects with marks
        const subjectCounts = await sql`
      SELECT subject, COUNT(*) as count, MAX(created_at) as last_saved
      FROM marks
      GROUP BY subject
      ORDER BY subject
    `;

        console.log('📊 Subjects with saved marks:\n');
        subjectCounts.forEach(s => {
            console.log(`  ${s.subject}: ${s.count} marks (last saved: ${s.last_saved})`);
        });

        console.log('\n🔍 Checking recent marks (last 20):\n');
        const recentMarks = await sql`
      SELECT m.subject, s.first_name, s.last_name, s.id_number, m.total, m.created_at
      FROM marks m
      JOIN students s ON m.student_id = s.id
      ORDER BY m.created_at DESC
      LIMIT 20
    `;

        recentMarks.forEach(mark => {
            console.log(`${mark.subject} - ${mark.first_name} ${mark.last_name} (${mark.id_number}) - Total: ${mark.total} - ${mark.created_at}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAllMarks();

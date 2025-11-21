import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function checkMarksByClass() {
    try {
        console.log('🔍 Checking marks by class and subject...\n');

        // Get all marks grouped by class and subject
        const marksByClass = await sql`
      SELECT 
        m.class_name,
        m.subject,
        COUNT(*) as student_count,
        MAX(m.created_at) as last_saved
      FROM marks m
      GROUP BY m.class_name, m.subject
      ORDER BY m.class_name, m.subject
    `;

        console.log('📊 Marks by Class and Subject:\n');
        let currentClass = '';
        marksByClass.forEach(row => {
            if (row.class_name !== currentClass) {
                currentClass = row.class_name;
                console.log(`\n📚 Class: ${currentClass || '(NULL)'}`);
            }
            console.log(`  - ${row.subject}: ${row.student_count} students (last: ${new Date(row.last_saved).toLocaleString()})`);
        });

        console.log('\n\n🔍 Sample marks data:\n');
        const sampleMarks = await sql`
      SELECT 
        m.class_name,
        m.subject,
        s.id_number,
        s.first_name,
        s.last_name,
        m.test1,
        m.exam,
        m.total
      FROM marks m
      JOIN students s ON m.student_id = s.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `;

        sampleMarks.forEach(mark => {
            console.log(`${mark.class_name} | ${mark.subject} | ${mark.first_name} ${mark.last_name} (${mark.id_number}) | T1:${mark.test1} E:${mark.exam} Total:${mark.total}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkMarksByClass();

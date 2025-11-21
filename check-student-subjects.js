import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;
if (!dbUrl) {
    console.error('❌ No database URL');
    process.exit(1);
}
const sql = neon(dbUrl);

(async () => {
    try {
        const student = await sql`SELECT id_number FROM students LIMIT 1`;
        if (!student.length) {
            console.log('No students found');
            return;
        }
        const studentId = student[0].id_number;
        console.log('Checking marks for student id:', studentId);
        const marks = await sql`SELECT subject FROM marks WHERE student_id = ${studentId}`;
        const subjects = marks.map(m => m.subject);
        console.log('Subjects for this student:', subjects);
    } catch (e) {
        console.error('Error:', e);
    }
})();

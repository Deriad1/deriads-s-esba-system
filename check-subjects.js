import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables!');
    process.exit(1);
}

const sql = neon(databaseUrl);

async function checkSubjects() {
    try {
        console.log('Checking distinct subjects in MARKS table...');
        const marksSubjects = await sql`SELECT DISTINCT subject FROM marks ORDER BY subject`;
        console.log('Subjects in marks:', marksSubjects.map(s => `"${s.subject}"`));

        console.log('\nChecking distinct subjects in TEACHERS table (assigned subjects)...');
        const teachers = await sql`SELECT subjects FROM teachers`;
        const teacherSubjects = new Set();
        teachers.forEach(t => {
            if (Array.isArray(t.subjects)) {
                t.subjects.forEach(s => teacherSubjects.add(s));
            }
        });
        console.log('Subjects assigned to teachers:', Array.from(teacherSubjects).sort().map(s => `"${s}"`));

    } catch (error) {
        console.error('Error checking subjects:', error);
    }
}

checkSubjects();

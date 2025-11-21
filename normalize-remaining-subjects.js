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
        console.log('🔄 Normalizing remaining subject names...');

        // Update marks table
        const updateMarks = await sql`UPDATE marks SET subject = 'Integrated Science' WHERE subject = 'Science'`;
        console.log('Updated marks Science -> Integrated Science');
        const updateMarksRME = await sql`UPDATE marks SET subject = 'Religious and Moral Education' WHERE subject = 'Religious & Moral Education'`;
        console.log('Updated marks Religious & Moral Education -> Religious and Moral Education');

        // Update teachers table - assuming subjects column is a JSON array of strings
        const teachers = await sql`SELECT id, subjects FROM teachers`;
        for (const teacher of teachers) {
            let subjects = teacher.subjects;
            if (Array.isArray(subjects)) {
                const newSubjects = subjects.map(sub => {
                    if (sub === 'Science') return 'Integrated Science';
                    if (sub === 'Religious & Moral Education') return 'Religious and Moral Education';
                    return sub;
                });
                if (JSON.stringify(subjects) !== JSON.stringify(newSubjects)) {
                    await sql`UPDATE teachers SET subjects = ${JSON.stringify(newSubjects)} WHERE id = ${teacher.id}`;
                    console.log(`Updated teacher ${teacher.id} subjects`);
                }
            }
        }

        console.log('✅ Subject normalization complete!');
    } catch (error) {
        console.error('Error during normalization:', error);
    }
})();

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables!');
    process.exit(1);
}

const sql = neon(databaseUrl);

async function normalizeSubjects() {
    try {
        console.log('🔄 Normalizing subjects in database...');

        // Define mappings (From -> To)
        // We want to standardize on the longer, more formal names usually
        const mappings = [
            { from: 'Ghanaian Language', to: 'Ghanaian Language and Culture' },
            { from: 'Our World Our People', to: 'Our World and Our People' },
            { from: 'R.M.E', to: 'Religious and Moral Education' },
            { from: 'RME', to: 'Religious and Moral Education' },
            { from: 'Religious and Moral Education (R.M.E.)', to: 'Religious and Moral Education' }
        ];

        // 1. Update MARKS table
        console.log('\nChecking table: marks');
        for (const map of mappings) {
            await sql`UPDATE marks SET subject = ${map.to} WHERE subject = ${map.from}`;
        }
        const marksSubjects = await sql`SELECT DISTINCT subject FROM marks ORDER BY subject`;
        console.log(`Current subjects in marks:`, marksSubjects.map(s => `"${s.subject}"`));

        // 2. Update TEACHERS table (subjects array)
        // This is trickier as it's an array of strings
        console.log('\nChecking table: teachers');

        // Fetch all teachers
        const teachers = await sql`SELECT id, subjects FROM teachers`;

        for (const teacher of teachers) {
            if (!teacher.subjects || !Array.isArray(teacher.subjects)) continue;

            let modified = false;
            const newSubjects = teacher.subjects.map(s => {
                const mapping = mappings.find(m => m.from === s);
                if (mapping) {
                    modified = true;
                    return mapping.to;
                }
                return s;
            });

            // Remove duplicates (in case mapping resulted in duplicate)
            const uniqueSubjects = [...new Set(newSubjects)];
            if (uniqueSubjects.length !== newSubjects.length) modified = true;

            if (modified) {
                console.log(`Updating teacher ${teacher.id} subjects...`);
                await sql`
          UPDATE teachers 
          SET subjects = ${uniqueSubjects}
          WHERE id = ${teacher.id}
        `;
            }
        }

        console.log('\n✨ Subject normalization complete!');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

normalizeSubjects();

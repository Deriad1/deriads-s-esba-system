import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables!');
    process.exit(1);
}

const sql = neon(databaseUrl);

async function normalizeTerms() {
    try {
        console.log('🔄 Normalizing terms in database...');

        // Define mappings
        const mappings = [
            { from: 'Term 1', to: 'First Term' },
            { from: 'Term 2', to: 'Second Term' },
            { from: 'Term 3', to: 'Third Term' },
            { from: '1st Term', to: 'First Term' },
            { from: '2nd Term', to: 'Second Term' },
            { from: '3rd Term', to: 'Third Term' }
        ];

        // MARKS TABLE
        console.log('\nChecking table: marks');
        for (const map of mappings) {
            await sql`UPDATE marks SET term = ${map.to} WHERE term = ${map.from}`;
        }
        const marksTerms = await sql`SELECT DISTINCT term FROM marks`;
        console.log(`Current terms in marks:`, marksTerms.map(t => `"${t.term}"`));

        // STUDENTS TABLE
        console.log('\nChecking table: students');
        for (const map of mappings) {
            await sql`UPDATE students SET term = ${map.to} WHERE term = ${map.from}`;
        }
        const studentsTerms = await sql`SELECT DISTINCT term FROM students`;
        console.log(`Current terms in students:`, studentsTerms.map(t => `"${t.term}"`));

        // TEACHERS TABLE
        console.log('\nChecking table: teachers');
        for (const map of mappings) {
            await sql`UPDATE teachers SET term = ${map.to} WHERE term = ${map.from}`;
        }
        const teachersTerms = await sql`SELECT DISTINCT term FROM teachers`;
        console.log(`Current terms in teachers:`, teachersTerms.map(t => `"${t.term}"`));

        // STUDENT_SCORES TABLE
        console.log('\nChecking table: student_scores');
        for (const map of mappings) {
            await sql`UPDATE student_scores SET term = ${map.to} WHERE term = ${map.from}`;
        }
        const scoresTerms = await sql`SELECT DISTINCT term FROM student_scores`;
        console.log(`Current terms in student_scores:`, scoresTerms.map(t => `"${t.term}"`));

        // FORM_MASTER_REMARKS TABLE
        console.log('\nChecking table: form_master_remarks');
        for (const map of mappings) {
            await sql`UPDATE form_master_remarks SET term = ${map.to} WHERE term = ${map.from}`;
        }
        const remarksTerms = await sql`SELECT DISTINCT term FROM form_master_remarks`;
        console.log(`Current terms in form_master_remarks:`, remarksTerms.map(t => `"${t.term}"`));

        console.log('\n✨ Term normalization complete!');

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

normalizeTerms();

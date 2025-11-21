import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;
if (!dbUrl) {
    console.error('❌ No database URL found!');
    process.exit(1);
}

const sql = neon(dbUrl);

async function normalizeRemarksTerms() {
    try {
        console.log('🔄 Normalizing terms in remarks table...');

        // Define mappings (From -> To)
        // Matching the logic used for marks table
        const mappings = [
            { from: 'Term 1', to: 'First Term' },
            { from: 'Term 2', to: 'Second Term' },
            { from: 'Term 3', to: 'Third Term' }
        ];

        for (const map of mappings) {
            console.log(`Updating "${map.from}" -> "${map.to}"...`);
            await sql`UPDATE remarks SET term = ${map.to} WHERE term = ${map.from}`;
        }

        const terms = await sql`SELECT DISTINCT term FROM remarks ORDER BY term`;
        console.log(`\n✨ Remarks term normalization complete!`);
        console.log(`Current terms in remarks:`, terms.map(t => `"${t.term}"`));

    } catch (error) {
        console.error('Fatal error:', error);
    }
}

normalizeRemarksTerms();

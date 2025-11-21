import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;
const sql = neon(dbUrl);

async function checkRemarks() {
    try {
        console.log('Checking remarks table...');

        // Check distinct terms
        const terms = await sql`SELECT DISTINCT term FROM remarks`;
        console.log('Distinct terms in remarks:', terms.map(t => `"${t.term}"`));

        // Check a sample record
        const sample = await sql`SELECT * FROM remarks LIMIT 1`;
        console.log('Sample remark record:', sample[0]);

    } catch (error) {
        console.error('Error checking remarks:', error);
    }
}

checkRemarks();

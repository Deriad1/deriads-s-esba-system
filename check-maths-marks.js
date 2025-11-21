import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;

if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables!');
    process.exit(1);
}

const sql = neon(databaseUrl);

async function checkTerms() {
    try {
        console.log('Checking all distinct terms in marks table...');
        const terms = await sql`SELECT DISTINCT term FROM marks`;
        console.log('Distinct terms:', terms.map(t => `"${t.term}"`));
    } catch (error) {
        console.error('Error checking terms:', error);
    }
}

checkTerms();

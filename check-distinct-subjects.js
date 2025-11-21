import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;
if (!dbUrl) {
    console.error('❌ No database URL');
    process.exit(1);
}
const sql = neon(dbUrl);

(async () => {
    try {
        const rows = await sql`SELECT DISTINCT subject FROM marks ORDER BY subject`;
        console.log('Distinct subjects in marks:');
        rows.forEach(r => console.log(' -', r.subject));
    } catch (e) {
        console.error('Error querying marks:', e);
    }
})();

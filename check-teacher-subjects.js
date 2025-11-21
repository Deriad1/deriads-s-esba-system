import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.VITE_POSTGRES_URL;
if (!dbUrl) {
    console.error('❌ No database URL');
    process.exit(1);
}
const sql = neon(dbUrl);

const className = 'BS5';
(async () => {
    try {
        const rows = await sql`SELECT id, subjects FROM teachers WHERE class_name = ${className}`;
        console.log('Teacher rows for class', className);
        rows.forEach(row => {
            console.log('Teacher ID:', row.id, 'Subjects:', row.subjects);
        });
    } catch (e) {
        console.error('Error:', e);
    }
})();

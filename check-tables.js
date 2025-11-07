import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function checkTables() {
  try {
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 Available tables:');
    result.forEach(row => console.log(`   - ${row.table_name}`));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTables();

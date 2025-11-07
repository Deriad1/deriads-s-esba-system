import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = neon(databaseUrl);

async function checkColumns() {
  try {
    console.log('🔍 Checking teachers table columns...\n');

    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'teachers'
      ORDER BY ordinal_position
    `;

    console.log('Current columns in teachers table:');
    console.table(columns);

    const columnNames = columns.map(c => c.column_name);
    const missingColumns = ['phone', 'form_class', 'requires_password_change', 'teacher_level']
      .filter(col => !columnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n⚠️  Missing columns:', missingColumns);
      console.log('\nAttempting to add missing columns...\n');

      for (const col of missingColumns) {
        try {
          if (col === 'phone') {
            await sql`ALTER TABLE teachers ADD COLUMN phone VARCHAR(50)`;
            console.log(`✅ Added column: ${col}`);
          } else if (col === 'form_class') {
            await sql`ALTER TABLE teachers ADD COLUMN form_class VARCHAR(50)`;
            console.log(`✅ Added column: ${col}`);
          } else if (col === 'requires_password_change') {
            await sql`ALTER TABLE teachers ADD COLUMN requires_password_change BOOLEAN DEFAULT true`;
            console.log(`✅ Added column: ${col}`);
          } else if (col === 'teacher_level') {
            await sql`ALTER TABLE teachers ADD COLUMN teacher_level VARCHAR(50)`;
            console.log(`✅ Added column: ${col}`);
          }
        } catch (err) {
          console.log(`❌ Failed to add ${col}:`, err.message);
        }
      }
    } else {
      console.log('\n✅ All required columns exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkColumns();

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.VITE_POSTGRES_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ Database URL not found in environment variables');
  process.exit(1);
}

const sql = neon(databaseUrl);

const addClassAssignedColumn = async () => {
  try {
    console.log('Adding class_assigned column to teachers table...');

    await sql`
      ALTER TABLE teachers
      ADD COLUMN IF NOT EXISTS class_assigned VARCHAR(50)
    `;

    console.log('✅ Column class_assigned added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    process.exit(1);
  }
};

addClassAssignedColumn();

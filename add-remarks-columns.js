// Migration: Add comments and attendance columns to remarks table
// Run with: node add-remarks-columns.js

import { sql } from './api/lib/db.js';

async function addRemarksColumns() {
  try {
    console.log('🔄 Checking remarks table structure...');

    // Add comments column if it doesn't exist
    try {
      await sql`
        ALTER TABLE remarks
        ADD COLUMN IF NOT EXISTS comments TEXT
      `;
      console.log('✅ Added comments column');
    } catch (error) {
      console.log('ℹ️  Comments column already exists or error:', error.message);
    }

    // Add attendance column if it doesn't exist
    try {
      await sql`
        ALTER TABLE remarks
        ADD COLUMN IF NOT EXISTS attendance VARCHAR(10)
      `;
      console.log('✅ Added attendance column');
    } catch (error) {
      console.log('ℹ️  Attendance column already exists or error:', error.message);
    }

    // Add attendance_total column if it doesn't exist
    try {
      await sql`
        ALTER TABLE remarks
        ADD COLUMN IF NOT EXISTS attendance_total INTEGER DEFAULT 0
      `;
      console.log('✅ Added attendance_total column');
    } catch (error) {
      console.log('ℹ️  Attendance_total column already exists or error:', error.message);
    }

    // Verify columns exist
    const tableInfo = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'remarks'
      ORDER BY ordinal_position
    `;

    console.log('\n📊 Current remarks table structure:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addRemarksColumns();

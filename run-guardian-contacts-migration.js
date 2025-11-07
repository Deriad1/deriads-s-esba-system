import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Now dynamically import the db module after env vars are loaded
const { sql } = await import('./api/lib/db.js');

async function runMigration() {
  try {
    console.log('🔧 Adding guardian contact columns to students table...\n');

    // Add email column
    await sql`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)
    `;
    console.log('✅ Added email column');

    // Add phone_number column
    await sql`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50)
    `;
    console.log('✅ Added phone_number column');

    // Add indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email)
    `;
    console.log('✅ Created email index');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone_number)
    `;
    console.log('✅ Created phone_number index');

    // Show updated table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'students'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 Updated students table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('You can now use email and phone_number fields for guardian/parent contact information.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

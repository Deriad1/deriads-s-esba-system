import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Now dynamically import the db module after env vars are loaded
const { sql } = await import('./api/lib/db.js');

async function createClassesTable() {
  try {
    console.log('🔧 Setting up classes table...\n');

    // Create classes table
    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(50) UNIQUE NOT NULL,
        level VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Classes table ready');

    // Add index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_classes_class_name ON classes(class_name)
    `;
    console.log('✅ Created index');

    // Populate with existing classes from students table
    await sql`
      INSERT INTO classes (class_name, created_at, updated_at)
      SELECT DISTINCT class_name, NOW(), NOW()
      FROM students
      WHERE class_name IS NOT NULL
        AND class_name != 'UNASSIGNED'
      ON CONFLICT (class_name) DO NOTHING
    `;
    console.log('✅ Populated with existing classes from students');

    // Show current classes
    const classes = await sql`
      SELECT class_name, created_at
      FROM classes
      ORDER BY class_name
    `;

    console.log('\n📋 Current classes in database:');
    classes.forEach(cls => {
      console.log(`  - ${cls.class_name}`);
    });

    console.log('\n✅ Classes table setup complete!');
    console.log('Classes can now be added independently of students.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

createClassesTable();

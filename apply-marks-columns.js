import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function applyMarksColumns() {
  try {
    // Dynamic import after env is loaded
    const { sql } = await import('./api/lib/db.js');

    console.log('🔧 Adding missing columns to marks table...\n');

    await sql`
      ALTER TABLE marks
      ADD COLUMN IF NOT EXISTS test1 DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS test2 DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS test3 DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS test4 DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS exam DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ca1 DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ca2 DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS exam_score DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS position INTEGER,
      ADD COLUMN IF NOT EXISTS grade VARCHAR(2),
      ADD COLUMN IF NOT EXISTS remark TEXT
    `;

    console.log('✅ Columns added successfully!\n');

    console.log('🔧 Creating indexes...\n');

    await sql`CREATE INDEX IF NOT EXISTS idx_marks_student_subject ON marks(student_id, subject)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marks_class_subject ON marks(class_name, subject) WHERE class_name IS NOT NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marks_term ON marks(term)`;

    console.log('✅ Indexes created successfully!\n');
    console.log('🎉 Migration completed!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMarksColumns();

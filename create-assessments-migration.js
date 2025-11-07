import 'dotenv/config';
import { sql } from './api/lib/db.js';

/**
 * Migration: Create assessments table and update marks table
 * Supports Midterm Exams, Mock Exams, and custom assessments
 */

async function runMigration() {
  console.log('🔄 Creating assessments table and updating schema...\n');

  try {
    // Step 1: Create assessments table
    console.log('1. Creating assessments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS assessments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        assessment_type VARCHAR(50) NOT NULL,
        max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
        term VARCHAR(50) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        applicable_classes TEXT[],
        applicable_subjects TEXT[],
        is_active BOOLEAN DEFAULT true,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('   ✅ Assessments table created\n');

    // Step 2: Create indexes
    console.log('2. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_assessments_term_year ON assessments(term, academic_year)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type)`;
    console.log('   ✅ Indexes created\n');

    // Step 3: Add columns to marks table
    console.log('3. Updating marks table...');
    await sql`ALTER TABLE marks ADD COLUMN IF NOT EXISTS assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE marks ADD COLUMN IF NOT EXISTS assessment_type VARCHAR(50) DEFAULT 'standard'`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marks_assessment_id ON marks(assessment_id)`;
    console.log('   ✅ Marks table updated\n');

    // Step 4: Create default standard assessment entry
    console.log('4. Creating default standard assessment...');
    const existing = await sql`
      SELECT id FROM assessments WHERE assessment_type = 'standard' LIMIT 1
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO assessments (
          name,
          description,
          assessment_type,
          max_score,
          term,
          academic_year,
          is_active
        ) VALUES (
          'Standard Assessment (Class Tests + Exam)',
          'Regular continuous assessment with 4 class tests and final exam',
          'standard',
          100,
          'Third Term',
          '2025/2026',
          true
        )
      `;
      console.log('   ✅ Default assessment created\n');
    } else {
      console.log('   ℹ️  Default assessment already exists\n');
    }

    // Step 5: Verify schema
    console.log('5. Verifying schema...');
    const assessmentCount = await sql`SELECT COUNT(*) as count FROM assessments`;
    const marksColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'marks'
      AND column_name IN ('assessment_id', 'assessment_type')
    `;

    console.log(`   ✅ Assessments table: ${assessmentCount[0].count} records`);
    console.log(`   ✅ Marks table: ${marksColumns.length} new columns added\n`);

    console.log('=' .repeat(70));
    console.log('✅ Migration completed successfully!');
    console.log('=' .repeat(70));
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. Create assessments via Admin Dashboard');
    console.log('3. Teachers can enter marks for assessments\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigration();

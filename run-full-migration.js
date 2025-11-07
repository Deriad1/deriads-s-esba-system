// Complete Database Setup - Creates ALL required tables
// Run this with: node run-full-migration.js

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

async function runFullMigration() {
  console.log('🚀 Starting FULL database migration...\n');

  try {
    // 1. Create marks table
    console.log('📝 Creating marks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS marks (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        term VARCHAR(50) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        class_score DECIMAL(5,2),
        exams_score DECIMAL(5,2),
        total_score DECIMAL(5,2),
        grade VARCHAR(2),
        remarks TEXT,
        teacher_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Marks table created\n');

    // 2. Create classes table
    console.log('📝 Creating classes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        class_name VARCHAR(50) UNIQUE NOT NULL,
        level VARCHAR(20),
        form_master_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Classes table created\n');

    // 3. Create remarks table
    console.log('📝 Creating remarks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS remarks (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        term VARCHAR(50) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        conduct VARCHAR(20),
        attitude VARCHAR(20),
        interest VARCHAR(20),
        remarks TEXT,
        teacher_id INTEGER,
        attendance_days INTEGER,
        attendance_present INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, term, academic_year)
      )
    `;
    console.log('✅ Remarks table created\n');

    // 4. Settings table (already created, but ensure it exists)
    console.log('📝 Ensuring settings table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        school_name VARCHAR(255) DEFAULT '',
        school_logo TEXT DEFAULT '',
        background_image TEXT DEFAULT '',
        term VARCHAR(50) DEFAULT 'First Term',
        academic_year VARCHAR(20) NOT NULL DEFAULT '2024/2025',
        current_year INTEGER NOT NULL DEFAULT 2024,
        school_address TEXT DEFAULT '',
        school_phone VARCHAR(50) DEFAULT '',
        school_email VARCHAR(100) DEFAULT '',
        school_motto TEXT DEFAULT '',
        principal_name VARCHAR(255) DEFAULT '',
        principal_signature TEXT DEFAULT '',
        grade_config JSONB DEFAULT '{"A": {"min": 80, "max": 100, "remark": "Excellent"}, "B": {"min": 70, "max": 79, "remark": "Very Good"}, "C": {"min": 60, "max": 69, "remark": "Good"}, "D": {"min": 50, "max": 59, "remark": "Pass"}, "E": {"min": 40, "max": 49, "remark": "Weak"}, "F": {"min": 0, "max": 39, "remark": "Fail"}}',
        report_card_template VARCHAR(50) DEFAULT 'default',
        enable_attendance BOOLEAN DEFAULT true,
        enable_remarks BOOLEAN DEFAULT true,
        enable_broadsheet BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert default settings if not exists
    const settingsCount = await sql`SELECT COUNT(*) as count FROM settings`;
    if (parseInt(settingsCount[0].count) === 0) {
      await sql`
        INSERT INTO settings (academic_year, current_year, term, school_name)
        VALUES ('2024/2025', 2024, 'First Term', 'DERIAD School')
      `;
      console.log('✅ Settings table created with defaults\n');
    } else {
      console.log('✅ Settings table already exists\n');
    }

    // 5. Archives table (already created, but ensure it exists)
    console.log('📝 Ensuring archives table exists...');
    await sql`
      CREATE TABLE IF NOT EXISTS archives (
        id SERIAL PRIMARY KEY,
        term VARCHAR(50) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        archived_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        archived_by INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(term, academic_year)
      )
    `;
    console.log('✅ Archives table ensured\n');

    // Create indexes
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marks_term ON marks(term, academic_year)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_remarks_student ON remarks(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_archives_term_year ON archives(term, academic_year)`;
    console.log('✅ Indexes created\n');

    // Verify all tables
    console.log('🔍 Verifying all tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 All Database Tables:');
    const requiredTables = ['students', 'teachers', 'marks', 'classes', 'remarks', 'settings', 'archives'];
    requiredTables.forEach(tableName => {
      const exists = tables.some(t => t.table_name === tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    });

    console.log('\n🎉 Full migration completed successfully!');
    console.log('\n✨ Your database is ready! Restart vercel dev if it\'s running.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runFullMigration();

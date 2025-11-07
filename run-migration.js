// Quick Database Migration Script
// Run this with: node run-migration.js

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Create settings table
    console.log('📝 Creating settings table...');
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
    console.log('✅ Settings table created\n');

    // Insert default settings
    console.log('📝 Inserting default settings...');
    await sql`
      INSERT INTO settings (academic_year, current_year, term)
      VALUES ('2024/2025', 2024, 'First Term')
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Default settings inserted\n');

    // Create archives table
    console.log('📝 Creating archives table...');
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
    console.log('✅ Archives table created\n');

    // Create indexes
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_archives_term_year ON archives(term, academic_year)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_archives_date ON archives(archived_date)`;
    console.log('✅ Indexes created\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('settings', 'archives', 'students', 'teachers', 'marks', 'classes', 'remarks')
      ORDER BY table_name
    `;

    console.log('\n📊 Database Tables:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.table_name}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n✨ You can now run your application with: vercel dev\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigration();

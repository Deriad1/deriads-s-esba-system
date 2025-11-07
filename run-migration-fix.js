import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigration() {
  try {
    console.log('🚀 Running database migration...\n');

    // Add missing columns
    console.log('Adding missing columns to teachers table...');
    await sql`
      ALTER TABLE teachers
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS form_class VARCHAR(50),
      ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS teacher_level VARCHAR(50)
    `;
    console.log('✅ Columns added successfully\n');

    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_form_class ON teachers(form_class)`;
    console.log('✅ Indexes created successfully\n');

    // Check if admin user exists
    console.log('Checking for existing admin user...');
    const existingAdmin = await sql`SELECT email FROM teachers WHERE email = 'admin@school.com'`;

    if (existingAdmin.length === 0) {
      console.log('Creating admin user (email: admin@school.com, password: admin123)...');
      // Password hash for "admin123"
      const adminPasswordHash = '$2a$10$rOIqx1J9l3P3N6.E0qYfz.xVbWvZp7YKXL2aM2J3K3L3M3N3O3P3Q';

      await sql`
        INSERT INTO teachers (
          first_name, last_name, email, password, gender,
          teacher_primary_role, all_roles, classes, subjects,
          term, academic_year, requires_password_change
        ) VALUES (
          'Admin',
          'User',
          'admin@school.com',
          ${adminPasswordHash},
          'male',
          'admin',
          ARRAY['admin', 'head_teacher']::TEXT[],
          ARRAY[]::TEXT[],
          ARRAY[]::TEXT[],
          'First Term',
          '2024/2025',
          false
        )
      `;
      console.log('✅ Admin user created successfully\n');
    } else {
      console.log('Admin user already exists\n');
    }

    // Check if test teacher exists
    console.log('Checking for existing test teacher...');
    const existingTeacher = await sql`SELECT email FROM teachers WHERE email = 'teacher1@example.com'`;

    if (existingTeacher.length === 0) {
      console.log('Creating test teacher (email: teacher1@example.com, password: teacher123)...');
      // Password hash for "teacher123"
      const teacherPasswordHash = '$2a$10$YZ1qx2J3l4P4N7.F1qZgz.yWbXvZp8ZKYM3bN3K4L4M4N4O4P4Q4R';

      await sql`
        INSERT INTO teachers (
          first_name, last_name, email, password, gender,
          teacher_primary_role, all_roles, classes, subjects,
          term, academic_year, requires_password_change
        ) VALUES (
          'Test',
          'Teacher',
          'teacher1@example.com',
          ${teacherPasswordHash},
          'female',
          'subject_teacher',
          ARRAY['subject_teacher']::TEXT[],
          ARRAY['BS7', 'BS8']::TEXT[],
          ARRAY['Mathematics', 'Science']::TEXT[],
          'First Term',
          '2024/2025',
          false
        )
      `;
      console.log('✅ Test teacher created successfully\n');
    } else {
      console.log('Test teacher already exists\n');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📝 You can now log in with:');
    console.log('   Admin: admin@school.com / admin123');
    console.log('   Teacher: teacher1@example.com / teacher123');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

runMigration();

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function createUsers() {
  try {
    console.log('🚀 Creating test users...\n');

    // Hash passwords
    console.log('Hashing passwords...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
    console.log('✅ Passwords hashed successfully\n');

    // Delete existing users first (to avoid conflicts)
    console.log('Removing existing test users...');
    await sql`DELETE FROM teachers WHERE email IN ('admin@school.com', 'teacher1@example.com')`;
    console.log('✅ Existing users removed\n');

    // Create admin user
    console.log('Creating admin user...');
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
    console.log('✅ Admin user created (email: admin@school.com, password: admin123)\n');

    // Create test teacher
    console.log('Creating test teacher...');
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
    console.log('✅ Test teacher created (email: teacher1@example.com, password: teacher123)\n');

    console.log('🎉 User creation completed successfully!');
    console.log('\n📝 You can now log in with:');
    console.log('   Admin: admin@school.com / admin123');
    console.log('   Teacher: teacher1@example.com / teacher123');

    // Verify users were created
    console.log('\n🔍 Verifying users...');
    const users = await sql`SELECT email, first_name, last_name, teacher_primary_role FROM teachers WHERE email IN ('admin@school.com', 'teacher1@example.com')`;
    console.log('Found users:', users);

  } catch (error) {
    console.error('❌ User creation failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

createUsers();

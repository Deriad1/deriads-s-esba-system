import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const sql = neon(databaseUrl);

async function createSimpleUser() {
  try {
    console.log('Creating a simple test user with password "123"...\n');

    const hashedPassword = await bcrypt.hash('123', 10);

    // Delete if exists
    await sql`DELETE FROM teachers WHERE email = 'test@test.com'`;

    // Create simple user
    const result = await sql`
      INSERT INTO teachers (
        first_name, last_name, email, password, gender,
        teacher_primary_role, all_roles, classes, subjects,
        term, academic_year, requires_password_change
      ) VALUES (
        'Test',
        'User',
        'test@test.com',
        ${hashedPassword},
        'male',
        'admin',
        ARRAY['admin', 'head_teacher']::TEXT[],
        ARRAY['BS7', 'BS8']::TEXT[],
        ARRAY['Mathematics', 'English Language']::TEXT[],
        'Third Term',
        '2025/2026',
        false
      )
      RETURNING id, email, first_name, last_name
    `;

    console.log('✅ User created successfully!\n');
    console.log('Login credentials:');
    console.log('  Email: test@test.com');
    console.log('  Password: 123');
    console.log(`  ID: ${result[0].id}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSimpleUser();

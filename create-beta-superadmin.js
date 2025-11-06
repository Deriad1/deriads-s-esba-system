#!/usr/bin/env node

/**
 * Creates Super Admin for Beta Testing
 *
 * Email: iamtrouble55@hotmail.com
 * Password: @218Eit1101399
 *
 * This super admin can assign other admins and has full system access
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createBetaSuperAdmin() {
  try {
    console.log('\n🚀 Creating Beta Super Admin Account...\n');

    // Super admin credentials
    const email = 'iamtrouble55@hotmail.com';
    const password = '@218Eit1101399';
    const firstName = 'Super';
    const lastName = 'Admin';

    // Check if user already exists
    console.log('📝 Checking for existing user...');
    const existingUser = await sql`
      SELECT * FROM teachers WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      console.log('⚠️  User already exists with email:', email);
      console.log('🔄 Updating to super admin role...');

      // Update existing user to super admin
      const hashedPassword = await bcrypt.hash(password, 10);

      await sql`
        UPDATE teachers
        SET password = ${hashedPassword},
            teacher_primary_role = 'admin',
            all_roles = ARRAY['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']::text[],
            first_name = ${firstName},
            last_name = ${lastName}
        WHERE email = ${email}
      `;

      console.log('✅ User updated successfully!');
    } else {
      console.log('✨ Creating new super admin...');

      // Hash password with bcrypt (10 rounds)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert super admin with all roles
      const result = await sql`
        INSERT INTO teachers (
          first_name,
          last_name,
          email,
          password,
          gender,
          teacher_primary_role,
          all_roles,
          classes,
          subjects,
          term,
          academic_year
        ) VALUES (
          ${firstName},
          ${lastName},
          ${email},
          ${hashedPassword},
          'other',
          'admin',
          ARRAY['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']::text[],
          ARRAY[]::text[],
          ARRAY[]::text[],
          'First Term',
          '2024/2025'
        )
        RETURNING id, email, teacher_primary_role, all_roles
      `;

      console.log('\n✅ Super Admin created successfully!\n');
      console.log('📋 Account Details:');
      console.log('   ID:', result[0].id);
      console.log('   Email:', result[0].email);
      console.log('   Primary Role:', result[0].teacher_primary_role);
      console.log('   All Roles:', result[0].all_roles);
    }

    console.log('\n🔐 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password: [Set as provided]');
    console.log('\n✨ This super admin can:');
    console.log('   • Access all system features');
    console.log('   • Create and manage other admins');
    console.log('   • Assign roles to teachers');
    console.log('   • Configure school settings');
    console.log('   • Manage all students and classes');
    console.log('\n🎉 Ready for Beta Testing!\n');

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Ensure database is accessible');
    console.error('3. Verify teachers table exists');
    process.exit(1);
  }
}

createBetaSuperAdmin();

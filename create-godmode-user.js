import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

const { sql } = await import('./api/lib/db.js');

/**
 * Creates a GODMODE user for development purposes
 * This user has full access to ALL pages and features
 */
async function createGodmodeUser() {
  try {
    console.log('🔧 Creating GODMODE user for development...\n');

    // Godmode credentials
    const email = 'godmode@esba.dev';
    const password = 'GodMode2025!'; // Strong password for security
    const firstName = 'Godmode';
    const lastName = 'Developer';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if godmode user already exists
    const existing = await sql`
      SELECT id, email, all_roles FROM teachers WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log('⚠️  Godmode user already exists!');
      console.log(`   Email: ${existing[0].email}`);
      console.log(`   Roles: ${existing[0].all_roles}`);
      console.log('\n🔄 Updating to ensure godmode role...\n');

      // Update to ensure they have godmode role
      await sql`
        UPDATE teachers
        SET all_roles = ARRAY['godmode', 'admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']::text[],
            teacher_primary_role = 'godmode'
        WHERE email = ${email}
      `;

      console.log('✅ Godmode user updated successfully!\n');
    } else {
      // Create new godmode user
      await sql`
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
          academic_year,
          requires_password_change
        ) VALUES (
          ${firstName},
          ${lastName},
          ${email},
          ${hashedPassword},
          'male',
          'godmode',
          ARRAY['godmode', 'admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']::text[],
          ARRAY[]::text[],
          ARRAY[]::text[],
          'First Term',
          '2024/2025',
          false
        )
      `;

      console.log('✅ Godmode user created successfully!\n');
    }

    // Display credentials
    console.log('═══════════════════════════════════════════════');
    console.log('🔧 GODMODE LOGIN CREDENTIALS (Development Only)');
    console.log('═══════════════════════════════════════════════');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n✨ Features:');
    console.log('   • Access to ALL pages (Admin, Head Teacher, Form Master, etc.)');
    console.log('   • Bypass all role restrictions');
    console.log('   • Full system access for testing');
    console.log('   • Marked with 🔧 GODMODE indicator\n');
    console.log('⚠️  WARNING: This is for DEVELOPMENT ONLY!');
    console.log('   Remove this user before deploying to production!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating godmode user:', error);
    process.exit(1);
  }
}

createGodmodeUser();

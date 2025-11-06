import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// In Node.js scripts, use process.env
const databaseUrl = process.env.VITE_POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ Database URL not found in environment variables.');
  console.error('Please check your .env file and ensure VITE_POSTGRES_URL is set.');
  process.exit(1);
}

const sql = neon(databaseUrl);

/**
 * Password Migration Script
 * This script hashes all existing plain-text passwords in the database
 * and creates a default admin account for initial access
 */

const SALT_ROUNDS = 10;

// Default admin credentials for initial system setup
const DEFAULT_ADMIN = {
  email: 'admin@deriad.edu.gh',
  password: 'Admin@2024!',
  firstName: 'System',
  lastName: 'Administrator',
  gender: 'male',
  primaryRole: 'admin',
  allRoles: ['admin', 'head_teacher', 'subject_teacher']
};

/**
 * Hash a plain text password
 */
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  return hashedPassword;
}

/**
 * Migrate existing teachers' passwords to hashed format
 */
async function migrateExistingPasswords() {
  try {
    console.log('🔄 Starting password migration...\n');

    // Get all teachers with plain text passwords (not starting with $2a$ or $2b$)
    const teachers = await sql`
      SELECT id, email, password, first_name, last_name
      FROM teachers
      WHERE password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%'
    `;

    if (teachers.length === 0) {
      console.log('✅ No plain-text passwords found. All passwords are already hashed!\n');
      return;
    }

    console.log(`📋 Found ${teachers.length} accounts with plain-text passwords\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const teacher of teachers) {
      try {
        // Hash the plain text password
        const hashedPassword = await hashPassword(teacher.password);

        // Update the database
        await sql`
          UPDATE teachers
          SET password = ${hashedPassword}
          WHERE id = ${teacher.id}
        `;

        console.log(`✅ Hashed password for: ${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error hashing password for ${teacher.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${successCount} accounts`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed: ${errorCount} accounts`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Create or update the default admin account
 */
async function ensureAdminAccount() {
  try {
    console.log('🔍 Checking for admin account...\n');

    // Check if admin account already exists
    const existing = await sql`
      SELECT * FROM teachers
      WHERE email = ${DEFAULT_ADMIN.email}
    `;

    const hashedPassword = await hashPassword(DEFAULT_ADMIN.password);

    if (existing.length > 0) {
      // Update existing admin account with hashed password
      await sql`
        UPDATE teachers
        SET password = ${hashedPassword},
            teacher_primary_role = ${DEFAULT_ADMIN.primaryRole},
            all_roles = ${DEFAULT_ADMIN.allRoles}
        WHERE email = ${DEFAULT_ADMIN.email}
      `;

      console.log(`✅ Updated existing admin account: ${DEFAULT_ADMIN.email}`);
    } else {
      // Get current term and year (with fallback if app_settings table doesn't exist)
      let currentTerm = 'Term 1';
      let currentYear = '2024/2025';

      try {
        const settingsResult = await sql`SELECT * FROM app_settings WHERE key IN ('currentTerm', 'currentAcademicYear')`;
        const settings = Object.fromEntries(settingsResult.map(s => [s.key, s.value]));
        currentTerm = settings.currentTerm || currentTerm;
        currentYear = settings.currentAcademicYear || currentYear;
      } catch (error) {
        console.log('ℹ️  Using default term and year (app_settings table not found)');
      }

      // Create new admin account
      await sql`
        INSERT INTO teachers (
          email, password, first_name, last_name, gender,
          teacher_primary_role, all_roles, classes, subjects,
          term, academic_year
        ) VALUES (
          ${DEFAULT_ADMIN.email},
          ${hashedPassword},
          ${DEFAULT_ADMIN.firstName},
          ${DEFAULT_ADMIN.lastName},
          ${DEFAULT_ADMIN.gender},
          ${DEFAULT_ADMIN.primaryRole},
          ${DEFAULT_ADMIN.allRoles},
          ARRAY['ALL'],
          ARRAY['All Subjects'],
          ${currentTerm},
          ${currentYear}
        )
      `;

      console.log(`✅ Created new admin account: ${DEFAULT_ADMIN.email}`);
    }

    console.log('\n🔐 Admin Credentials:');
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log('\n⚠️  IMPORTANT: Please change the admin password after first login!\n');

  } catch (error) {
    console.error('❌ Error ensuring admin account:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║     DERIAD\'S eSBA - Password Security Migration      ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Step 1: Migrate existing passwords
    await migrateExistingPasswords();

    // Step 2: Ensure admin account exists
    await ensureAdminAccount();

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║              Migration Completed Successfully!        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                Migration Failed!                      ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    process.exit(1);
  }
}

// Run the migration
main();

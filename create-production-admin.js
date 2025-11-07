import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import readline from 'readline';

dotenv.config();

const { sql } = await import('./api/lib/db.js');

/**
 * Creates the initial admin user for production deployment
 * Run this ONCE after deploying to production
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createProductionAdmin() {
  try {
    console.log('\n═══════════════════════════════════════════════');
    console.log('🚀 PRODUCTION ADMIN USER SETUP');
    console.log('═══════════════════════════════════════════════\n');

    // Get admin details from user
    const firstName = await question('Enter admin first name: ');
    const lastName = await question('Enter admin last name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password (min 8 chars): ');
    const confirmPassword = await question('Confirm password: ');

    // Validate inputs
    if (!firstName || !lastName || !email || !password) {
      console.error('\n❌ Error: All fields are required!');
      rl.close();
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error('\n❌ Error: Passwords do not match!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters!');
      rl.close();
      process.exit(1);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('\n❌ Error: Invalid email format!');
      rl.close();
      process.exit(1);
    }

    console.log('\n🔄 Creating admin user...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existing = await sql`
      SELECT id, email FROM teachers WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.error('❌ Error: A user with this email already exists!');
      rl.close();
      process.exit(1);
    }

    // Create admin user
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
        academic_year,
        requires_password_change
      ) VALUES (
        ${firstName},
        ${lastName},
        ${email},
        ${hashedPassword},
        'male',
        'admin',
        ARRAY['admin', 'head_teacher']::text[],
        ARRAY[]::text[],
        ARRAY[]::text[],
        'First Term',
        '2024/2025',
        false
      )
      RETURNING id, email
    `;

    console.log('✅ Production admin user created successfully!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('📋 ADMIN LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════');
    console.log(`📧 Email:    ${email}`);
    console.log(`👤 Name:     ${firstName} ${lastName}`);
    console.log(`🔑 Password: [Secure - You entered this]`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n✨ Admin Features:');
    console.log('   • Full access to Admin Dashboard');
    console.log('   • Manage teachers and students');
    console.log('   • Access to all system features');
    console.log('   • Can create additional users\n');
    console.log('💡 You can now login at: ' + (process.env.VITE_APP_URL || 'your-domain.com'));
    console.log('\n⚠️  IMPORTANT: Store these credentials securely!');
    console.log('   This is the only time the password is displayed.\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    console.error('Error details:', error.message);
    rl.close();
    process.exit(1);
  }
}

createProductionAdmin();

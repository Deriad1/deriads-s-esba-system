import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.VITE_POSTGRES_URL);

async function testAuth() {
  console.log('\n= Testing Authentication System\n');
  console.log('=====================================');

  // Test 1: Verify admin account exists
  console.log('\n1ã  Checking admin account...');
  const admin = await sql`SELECT email, password, first_name, last_name, teacher_primary_role FROM teachers WHERE email = 'admin@deriad.edu.gh'`;

  if (admin.length > 0) {
    console.log(' Admin account found:');
    console.log('   Email:', admin[0].email);
    console.log('   Name:', admin[0].first_name, admin[0].last_name);
    console.log('   Role:', admin[0].teacher_primary_role);
    console.log('   Password Hash:', admin[0].password.substring(0, 20) + '...');
  } else {
    console.log('L Admin account not found!');
    return;
  }

  // Test 2: Verify password is hashed
  console.log('\n2ã  Verifying password is hashed...');
  if (admin[0].password.startsWith('$2a$') || admin[0].password.startsWith('$2b$')) {
    console.log(' Password is properly hashed (bcrypt)');
  } else {
    console.log('L Password is not hashed!');
    return;
  }

  // Test 3: Test password verification
  console.log('\n3ã  Testing password verification...');
  const isValid = await bcrypt.compare('Admin@2024!', admin[0].password);
  if (isValid) {
    console.log(' Password verification successful!');
  } else {
    console.log('L Password verification failed!');
    return;
  }

  // Test 4: Check all users have hashed passwords
  console.log('\n4ã  Checking all user passwords...');
  const allUsers = await sql`SELECT id, email, password FROM teachers`;
  console.log(`   Total users: ${allUsers.length}`);

  let hashedCount = 0;
  let plainTextCount = 0;

  for (const user of allUsers) {
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      hashedCount++;
    } else {
      plainTextCount++;
      console.log(`      Plain text password found: ${user.email}`);
    }
  }

  console.log(`    Hashed passwords: ${hashedCount}`);
  console.log(`   L Plain text passwords: ${plainTextCount}`);

  console.log('\n=====================================');
  console.log('<‰ Authentication System Test Complete!\n');
}

testAuth().catch(console.error);

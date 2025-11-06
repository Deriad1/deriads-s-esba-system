#!/usr/bin/env node

/**
 * Verifies Beta Deployment Readiness
 * Checks that godmode is removed and super admin is set up
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function verifyDeployment() {
  console.log('\n🔍 Verifying Beta Deployment Readiness...\n');
  console.log('=' .repeat(60));

  let allChecks = true;

  try {
    // Check 1: No godmode users
    console.log('\n✓ Check 1: Godmode Users');
    console.log('-'.repeat(60));
    const godmodeUsers = await sql`
      SELECT id, email FROM teachers
      WHERE 'godmode' = ANY(all_roles) OR teacher_primary_role = 'godmode'
    `;

    if (godmodeUsers.length === 0) {
      console.log('   ✅ PASS - No godmode users found');
    } else {
      console.log('   ❌ FAIL - Found godmode users:');
      godmodeUsers.forEach(u => console.log(`      - ${u.email}`));
      allChecks = false;
    }

    // Check 2: Super admin exists
    console.log('\n✓ Check 2: Super Admin Account');
    console.log('-'.repeat(60));
    const superAdmin = await sql`
      SELECT id, email, first_name, last_name, teacher_primary_role, all_roles
      FROM teachers
      WHERE email = 'iamtrouble55@hotmail.com'
    `;

    if (superAdmin.length === 1) {
      const admin = superAdmin[0];
      console.log('   ✅ PASS - Super Admin account exists');
      console.log(`      Email: ${admin.email}`);
      console.log(`      Name: ${admin.first_name} ${admin.last_name}`);
      console.log(`      Primary Role: ${admin.teacher_primary_role}`);
      console.log(`      All Roles: ${admin.all_roles.join(', ')}`);
    } else if (superAdmin.length === 0) {
      console.log('   ❌ FAIL - Super Admin account not found');
      allChecks = false;
    } else {
      console.log('   ⚠️  WARNING - Multiple accounts with same email');
      allChecks = false;
    }

    // Check 3: Database connection
    console.log('\n✓ Check 3: Database Connection');
    console.log('-'.repeat(60));
    const dbTest = await sql`SELECT 1 as test`;
    if (dbTest.length === 1) {
      console.log('   ✅ PASS - Database connection working');
    } else {
      console.log('   ❌ FAIL - Database connection issue');
      allChecks = false;
    }

    // Check 4: Count total users
    console.log('\n✓ Check 4: Total Users');
    console.log('-'.repeat(60));
    const userCount = await sql`SELECT COUNT(*) as count FROM teachers`;
    console.log(`   ℹ️  Total users in database: ${userCount[0].count}`);

    // Final summary
    console.log('\n' + '='.repeat(60));
    if (allChecks) {
      console.log('\n🎉 ALL CHECKS PASSED - READY FOR BETA DEPLOYMENT!\n');
      console.log('Login Credentials:');
      console.log('   Email: iamtrouble55@hotmail.com');
      console.log('   Password: @218Eit1101399\n');
      console.log('Next Steps:');
      console.log('   1. Deploy to Vercel: vercel --prod');
      console.log('   2. Test login with super admin');
      console.log('   3. Configure school settings');
      console.log('   4. Create additional admin accounts\n');
    } else {
      console.log('\n⚠️  DEPLOYMENT VERIFICATION FAILED\n');
      console.log('Please fix the issues above before deploying.\n');
    }

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    process.exit(1);
  }
}

verifyDeployment();

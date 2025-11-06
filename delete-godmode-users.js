#!/usr/bin/env node

/**
 * Deletes all godmode users from the database
 * Run this before production deployment
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function deleteGodmodeUsers() {
  try {
    console.log('\n🔍 Searching for godmode users...\n');

    // Find all users with godmode role
    const godmodeUsers = await sql`
      SELECT id, email, first_name, last_name, teacher_primary_role, all_roles
      FROM teachers
      WHERE 'godmode' = ANY(all_roles)
         OR teacher_primary_role = 'godmode'
    `;

    if (godmodeUsers.length === 0) {
      console.log('✅ No godmode users found in database.\n');
      return;
    }

    console.log(`⚠️  Found ${godmodeUsers.length} godmode user(s):\n`);
    godmodeUsers.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
    });

    console.log('\n🗑️  Deleting godmode users...\n');

    // Delete all godmode users
    const result = await sql`
      DELETE FROM teachers
      WHERE 'godmode' = ANY(all_roles)
         OR teacher_primary_role = 'godmode'
      RETURNING id, email
    `;

    console.log(`✅ Deleted ${result.length} godmode user(s):\n`);
    result.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}`);
    });

    console.log('\n✨ Database cleaned successfully!\n');

  } catch (error) {
    console.error('\n❌ Error deleting godmode users:', error.message);
    process.exit(1);
  }
}

deleteGodmodeUsers();

import { sql } from './api/lib/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    console.log('Checking users in database...\n');

    const users = await sql`SELECT id, email, first_name, last_name, role FROM users LIMIT 10`;

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nYou need to create users first. Run: node create-users.js');
    } else {
      console.log(`✅ Found ${users.length} users:\n`);
      users.forEach(user => {
        console.log(`  - Email: ${user.email}`);
        console.log(`    Name: ${user.first_name} ${user.last_name}`);
        console.log(`    Role: ${user.role}`);
        console.log(`    ID: ${user.id}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();

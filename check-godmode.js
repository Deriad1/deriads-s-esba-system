import dotenv from 'dotenv';
dotenv.config();

import { sql } from './api/lib/db.js';

async function checkGodmodeUser() {
  try {
    const result = await sql`
      SELECT id, email, teacher_primary_role, all_roles
      FROM teachers
      WHERE email = 'godmode@esba.dev'
    `;

    console.log('Godmode user data:');
    console.log(JSON.stringify(result, null, 2));

    if (result.length > 0) {
      console.log('\nPrimary Role:', result[0].teacher_primary_role);
      console.log('All Roles:', result[0].all_roles);
      console.log('Number of roles:', result[0].all_roles?.length || 0);
    } else {
      console.log('❌ Godmode user not found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkGodmodeUser();

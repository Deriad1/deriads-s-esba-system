import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const sql = neon(databaseUrl);

async function addAllRoles() {
  try {
    console.log('Adding all roles to test@test.com...\n');

    // Update the user to have all roles
    const result = await sql`
      UPDATE teachers
      SET
        all_roles = ARRAY['admin', 'head_teacher', 'form_master', 'class_teacher', 'subject_teacher']::TEXT[],
        classes = ARRAY['BS7', 'BS8', 'BS9', 'KG1', 'KG2']::TEXT[],
        subjects = ARRAY['Mathematics', 'English Language', 'Science', 'ICT']::TEXT[]
      WHERE email = 'test@test.com'
      RETURNING id, email, first_name, last_name, all_roles
    `;

    if (result.length > 0) {
      console.log('✅ Successfully updated user!\n');
      console.log('User Details:');
      console.log(`  Email: ${result[0].email}`);
      console.log(`  Name: ${result[0].first_name} ${result[0].last_name}`);
      console.log(`  Roles: ${result[0].all_roles.join(', ')}`);
      console.log('\nYou now have access to all 5 dashboards:');
      console.log('  👑 Admin Dashboard');
      console.log('  🎓 Head Teacher Dashboard');
      console.log('  📋 Form Master Dashboard');
      console.log('  👩‍🏫 Class Teacher Dashboard');
      console.log('  📚 Subject Teacher Dashboard');
      console.log('\nLog out and log back in to see all roles in the switcher!\n');
    } else {
      console.log('❌ User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addAllRoles();

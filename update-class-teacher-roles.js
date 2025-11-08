import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function updateClassTeacherRoles() {
  try {
    console.log('Starting role migration: form_master -> class_teacher...\n');

    // First, check current teachers with form_master role
    const formMasters = await sql`
      SELECT id, first_name, last_name, email, teacher_primary_role, all_roles, form_class, class_assigned
      FROM teachers
      WHERE teacher_primary_role = 'form_master'
    `;

    console.log(`Found ${formMasters.length} teachers with form_master role:`);
    formMasters.forEach(teacher => {
      console.log(`- ${teacher.first_name} ${teacher.last_name} (${teacher.email}) - Class: ${teacher.form_class || teacher.class_assigned}`);
    });

    if (formMasters.length === 0) {
      console.log('\nNo teachers to update.');
      return;
    }

    console.log('\nUpdating teachers...');

    // Update each form_master to class_teacher
    for (const teacher of formMasters) {
      // Update all_roles array: replace 'form_master' with 'class_teacher'
      let updatedRoles = teacher.all_roles || [];
      if (updatedRoles.includes('form_master')) {
        updatedRoles = updatedRoles.map(role => role === 'form_master' ? 'class_teacher' : role);
      } else if (!updatedRoles.includes('class_teacher')) {
        updatedRoles.push('class_teacher');
      }

      await sql`
        UPDATE teachers
        SET teacher_primary_role = 'class_teacher',
            all_roles = ${updatedRoles}
        WHERE id = ${teacher.id}
      `;

      console.log(`✓ Updated ${teacher.first_name} ${teacher.last_name}`);
    }

    console.log('\n✓ Role migration complete!');

    // Verify the changes
    console.log('\nVerifying updates...');
    const classTeachers = await sql`
      SELECT id, first_name, last_name, email, teacher_primary_role, all_roles, form_class, class_assigned
      FROM teachers
      WHERE teacher_primary_role = 'class_teacher' OR 'class_teacher' = ANY(all_roles)
      ORDER BY first_name
    `;

    console.log(`\nClass teachers in system (${classTeachers.length}):`);
    classTeachers.forEach(teacher => {
      console.log(`- ${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
      console.log(`  Primary Role: ${teacher.teacher_primary_role}`);
      console.log(`  All Roles: ${teacher.all_roles.join(', ')}`);
      console.log(`  Class: ${teacher.form_class || teacher.class_assigned || 'None'}`);
    });

  } catch (error) {
    console.error('Error updating roles:', error);
    throw error;
  }
}

updateClassTeacherRoles()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });

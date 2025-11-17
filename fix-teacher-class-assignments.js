import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please set DATABASE_URL in your .env file');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function fixTeacherAssignments() {
  console.log('\n🔧 FIXING TEACHER CLASS ASSIGNMENTS\n');
  console.log('='.repeat(60));

  try {
    // Get all teachers
    const teachers = await sql`
      SELECT
        id,
        first_name,
        last_name,
        email,
        teacher_primary_role,
        classes,
        class_assigned,
        form_class,
        all_roles
      FROM teachers
    `;

    console.log(`\n📊 Found ${teachers.length} teachers to process...\n`);

    let fixedCount = 0;

    for (const teacher of teachers) {
      const updates = {};
      let needsUpdate = false;
      let changes = [];

      const classesArray = teacher.classes || [];
      const classAssigned = teacher.class_assigned;
      const formClass = teacher.form_class;
      const primaryRole = teacher.teacher_primary_role;

      // Fix 1: Synchronize class_assigned with classes array
      if (classAssigned && !classesArray.includes(classAssigned)) {
        updates.classes = [...classesArray, classAssigned];
        needsUpdate = true;
        changes.push(`Add "${classAssigned}" to classes array`);
      }

      // Fix 2: For class_teachers with class_assigned but empty classes array
      if (primaryRole === 'class_teacher' && classAssigned && classesArray.length === 0) {
        updates.classes = [classAssigned];
        needsUpdate = true;
        changes.push(`Set classes array to [${classAssigned}]`);
      }

      // Fix 3: Set form_class for form_masters who have JHS classes but no form_class
      if (primaryRole === 'form_master' && !formClass && classesArray.length > 0) {
        // Find a JHS class (BS7, BS8, or BS9) in their classes
        const jhsClasses = classesArray.filter(cls =>
          ['BS7', 'BS8', 'BS9'].includes(cls)
        );

        if (jhsClasses.length > 0) {
          // Use the first JHS class as their form class
          updates.form_class = jhsClasses[0];
          needsUpdate = true;
          changes.push(`Set form_class to "${jhsClasses[0]}"`);
        }
      }

      // Fix 4: Ensure form_class is in the classes array
      if (formClass && !classesArray.includes(formClass)) {
        const updatedClasses = updates.classes || classesArray;
        updates.classes = [...updatedClasses, formClass];
        needsUpdate = true;
        changes.push(`Add form_class "${formClass}" to classes array`);
      }

      if (needsUpdate) {
        console.log(`✓ Fixing ${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
        changes.forEach(change => console.log(`  - ${change}`));

        if (updates.classes !== undefined && updates.form_class !== undefined) {
          await sql`
            UPDATE teachers
            SET classes = ${updates.classes},
                form_class = ${updates.form_class},
                updated_at = NOW()
            WHERE id = ${teacher.id}
          `;
          fixedCount++;
        } else if (updates.classes !== undefined) {
          await sql`
            UPDATE teachers
            SET classes = ${updates.classes},
                updated_at = NOW()
            WHERE id = ${teacher.id}
          `;
          fixedCount++;
        } else if (updates.form_class !== undefined) {
          await sql`
            UPDATE teachers
            SET form_class = ${updates.form_class},
                updated_at = NOW()
            WHERE id = ${teacher.id}
          `;
          fixedCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Fixed ${fixedCount} teachers`);
    console.log(`✓ ${teachers.length - fixedCount} teachers were already correct\n`);

    // Verify the fixes
    console.log('🔍 Verifying fixes...\n');

    const verifyTeachers = await sql`
      SELECT
        id,
        first_name,
        last_name,
        teacher_primary_role,
        classes,
        class_assigned,
        form_class
      FROM teachers
      WHERE teacher_primary_role IN ('class_teacher', 'form_master')
    `;

    let remainingIssues = 0;

    verifyTeachers.forEach(teacher => {
      const classesArray = teacher.classes || [];
      const classAssigned = teacher.class_assigned;
      const formClass = teacher.form_class;
      const primaryRole = teacher.teacher_primary_role;

      // Check for issues
      if (classAssigned && !classesArray.includes(classAssigned)) {
        console.log(`⚠️  ${teacher.first_name} ${teacher.last_name}: class_assigned not in classes array`);
        remainingIssues++;
      }

      if (primaryRole === 'form_master' && classesArray.some(c => ['BS7', 'BS8', 'BS9'].includes(c)) && !formClass) {
        console.log(`⚠️  ${teacher.first_name} ${teacher.last_name}: form_master with JHS classes but no form_class`);
        remainingIssues++;
      }

      if (primaryRole === 'class_teacher' && classAssigned && classesArray.length === 0) {
        console.log(`⚠️  ${teacher.first_name} ${teacher.last_name}: class_teacher with class_assigned but empty classes array`);
        remainingIssues++;
      }
    });

    if (remainingIssues === 0) {
      console.log('✅ All teacher assignments are now consistent!\n');
    } else {
      console.log(`\n⚠️  ${remainingIssues} issues still need manual review\n`);
    }

  } catch (error) {
    console.error('\n❌ Error fixing assignments:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

fixTeacherAssignments();

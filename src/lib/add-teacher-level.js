import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.VITE_POSTGRES_URL);

async function addTeacherLevel() {
  console.log('\n📚 Adding Teaching Level to Teachers Table\n');
  console.log('==========================================');

  try {
    // Check if column already exists
    const columnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teachers' AND column_name = 'teaching_level'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ Column "teaching_level" already exists');
    } else {
      // Add teaching_level column
      await sql`
        ALTER TABLE teachers
        ADD COLUMN teaching_level VARCHAR(20) DEFAULT 'PRIMARY'
      `;
      console.log('✅ Added teaching_level column to teachers table');
    }

    // Check if form_class column exists
    const formClassCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'teachers' AND column_name = 'form_class'
    `;

    if (formClassCheck.length > 0) {
      console.log('✅ Column "form_class" already exists');
    } else {
      // Add form_class column for form masters
      await sql`
        ALTER TABLE teachers
        ADD COLUMN form_class VARCHAR(50)
      `;
      console.log('✅ Added form_class column to teachers table');
    }

    // Update existing teachers based on their classes
    console.log('\n🔄 Updating existing teacher levels...');

    const teachers = await sql`SELECT id, classes FROM teachers`;

    for (const teacher of teachers) {
      if (!teacher.classes || teacher.classes.length === 0) {
        continue;
      }

      // Determine teaching level based on classes
      let level = 'PRIMARY';
      const classes = teacher.classes;

      const hasKG = classes.some(c => c.startsWith('KG'));
      const hasPrimary = classes.some(c => ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6'].includes(c));
      const hasJHS = classes.some(c => ['BS7', 'BS8', 'BS9'].includes(c));

      if (hasJHS) {
        level = 'JHS';
      } else if (hasKG) {
        level = 'KG';
      } else if (hasPrimary) {
        level = 'PRIMARY';
      }

      await sql`
        UPDATE teachers
        SET teaching_level = ${level}
        WHERE id = ${teacher.id}
      `;
    }

    console.log(`✅ Updated ${teachers.length} teachers with teaching levels`);

    // Show summary
    const summary = await sql`
      SELECT teaching_level, COUNT(*) as count
      FROM teachers
      GROUP BY teaching_level
    `;

    console.log('\n📊 Teacher Level Distribution:');
    summary.forEach(row => {
      console.log(`   ${row.teaching_level}: ${row.count} teachers`);
    });

    console.log('\n==========================================');
    console.log('✅ Migration Complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

addTeacherLevel();

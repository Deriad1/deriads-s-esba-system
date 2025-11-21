import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function migrateProductionDatabase() {
  console.log('\n🚨 PRODUCTION DATABASE MIGRATION 🚨\n');
  console.log('='.repeat(60));
  console.log('\nThis script will:');
  console.log('1. Standardize term names in marks table');
  console.log('2. Update system configuration');
  console.log('3. Fix teacher class assignments');
  console.log('\n' + '='.repeat(60));

  // Ask for database URL
  console.log('\n📋 Please provide your production database URL');
  console.log('(You can find this in your Render dashboard → Database → Connection String)\n');

  const dbUrl = await question('Production DATABASE_URL: ');

  if (!dbUrl || dbUrl.trim() === '') {
    console.log('\n❌ No database URL provided. Exiting.\n');
    rl.close();
    process.exit(1);
  }

  const sql = neon(dbUrl.trim());

  try {
    // Verify connection and show database info
    console.log('\n🔍 Verifying database connection...\n');

    const dbCheck = await sql`SELECT current_database() as db_name`;
    console.log(`✓ Connected to database: ${dbCheck[0].db_name}`);

    // Show current state
    const config = await sql`
      SELECT config_key, config_value
      FROM system_config
      WHERE config_key IN ('current_term', 'current_academic_year', 'school_name')
    `;

    console.log('\nCurrent system configuration:');
    config.forEach(c => {
      console.log(`  ${c.config_key}: ${c.config_value}`);
    });

    const marksCount = await sql`SELECT COUNT(*) as count FROM marks`;
    console.log(`\nTotal marks in database: ${marksCount[0].count}`);

    // Final confirmation
    console.log('\n' + '='.repeat(60));
    console.log('\n⚠️  IMPORTANT: This will modify your PRODUCTION database!');
    console.log('\n' + '='.repeat(60));

    const confirm = await question('\nType "YES" to proceed with migration: ');

    if (confirm.toUpperCase() !== 'YES') {
      console.log('\n❌ Migration cancelled.\n');
      rl.close();
      process.exit(0);
    }

    // Run migrations
    console.log('\n🔧 Running migrations...\n');

    // Migration 1: Standardize term names
    console.log('📝 Step 1: Standardizing term names...');

    const term1Fix = await sql`
      UPDATE marks
      SET term = 'First Term', updated_at = NOW()
      WHERE term = 'Term 1'
      RETURNING id
    `;
    console.log(`  ✓ Updated ${term1Fix.length} marks from "Term 1" → "First Term"`);

    const term2Fix = await sql`
      UPDATE marks
      SET term = 'Second Term', updated_at = NOW()
      WHERE term = 'Term 2'
      RETURNING id
    `;
    console.log(`  ✓ Updated ${term2Fix.length} marks from "Term 2" → "Second Term"`);

    const term3Fix = await sql`
      UPDATE marks
      SET term = 'Third Term', updated_at = NOW()
      WHERE term = 'Term 3'
      RETURNING id
    `;
    console.log(`  ✓ Updated ${term3Fix.length} marks from "Term 3" → "Third Term"`);

    // Migration 2: Update system config
    console.log('\n📝 Step 2: Updating system configuration...');

    const yearUpdate = await sql`
      UPDATE system_config
      SET config_value = '2025/2026', updated_at = NOW()
      WHERE config_key = 'current_academic_year'
      RETURNING config_value
    `;
    console.log(`  ✓ Updated academic year: ${yearUpdate[0]?.config_value || '2025/2026'}`);

    const termUpdate = await sql`
      UPDATE system_config
      SET config_value = 'First Term', updated_at = NOW()
      WHERE config_key = 'current_term'
      RETURNING config_value
    `;
    console.log(`  ✓ Updated current term: ${termUpdate[0]?.config_value || 'First Term'}`);

    // Migration 3: Fix teacher assignments
    console.log('\n📝 Step 3: Fixing teacher class assignments...');

    const teachers = await sql`
      SELECT id, first_name, last_name, classes, class_assigned, form_class
      FROM teachers
      WHERE class_assigned IS NOT NULL AND (classes IS NULL OR array_length(classes, 1) IS NULL)
    `;

    let fixedTeachers = 0;
    for (const teacher of teachers) {
      if (teacher.class_assigned) {
        await sql`
          UPDATE teachers
          SET classes = ARRAY[${teacher.class_assigned}]::text[],
              updated_at = NOW()
          WHERE id = ${teacher.id}
        `;
        fixedTeachers++;
      }
    }
    console.log(`  ✓ Fixed ${fixedTeachers} teacher class assignments`);

    // Verify the migration
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 Verifying migration...\n');

    const newConfig = await sql`
      SELECT config_key, config_value
      FROM system_config
      WHERE config_key IN ('current_term', 'current_academic_year')
    `;

    console.log('Updated system configuration:');
    newConfig.forEach(c => {
      console.log(`  ${c.config_key}: ${c.config_value}`);
    });

    const currentTerm = newConfig.find(c => c.config_key === 'current_term')?.config_value;
    const currentYear = newConfig.find(c => c.config_key === 'current_academic_year')?.config_value;

    const marksInCurrent = await sql`
      SELECT COUNT(*) as count
      FROM marks
      WHERE term = ${currentTerm} AND academic_year = ${currentYear}
    `;

    console.log(`\n✓ Marks in current term/year: ${marksInCurrent[0].count}`);

    if (marksInCurrent[0].count > 0) {
      console.log('\n✅ SUCCESS! Migration completed successfully!');
      console.log('\nMarks will now load properly in your application.\n');
    } else {
      console.log('\n⚠️  Warning: No marks found for current term/year');
      console.log('You may need to save new marks or adjust the current term.\n');
    }

    console.log('='.repeat(60));
    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    console.log('\n⚠️  Your database was NOT modified.\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

migrateProductionDatabase();

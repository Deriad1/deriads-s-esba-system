import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function diagnoseMarks() {
  console.log('\n🔍 MARKS DATABASE DIAGNOSTIC\n');
  console.log('='.repeat(60));

  try {
    // Check if marks table exists and get column structure
    console.log('\n📋 STEP 1: Checking marks table schema...\n');

    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'marks'
      ORDER BY ordinal_position
    `;

    if (columns.length === 0) {
      console.log('❌ marks table does not exist!');
      return;
    }

    console.log('Marks table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Check total marks count
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 STEP 2: Checking marks data...\n');

    const totalMarks = await sql`
      SELECT COUNT(*) as count FROM marks
    `;

    console.log(`Total marks records: ${totalMarks[0].count}`);

    if (totalMarks[0].count === 0) {
      console.log('\n⚠️  No marks found in database!');
      console.log('This is why loading returns "No saved marks found"');
      return;
    }

    // Get unique terms
    const terms = await sql`
      SELECT DISTINCT term, COUNT(*) as count
      FROM marks
      GROUP BY term
      ORDER BY term
    `;

    console.log('\n📅 Terms in database:');
    terms.forEach(t => {
      console.log(`  - ${t.term}: ${t.count} records`);
    });

    // Get unique academic years
    const years = await sql`
      SELECT DISTINCT academic_year, COUNT(*) as count
      FROM marks
      GROUP BY academic_year
      ORDER BY academic_year
    `;

    console.log('\n📆 Academic years in database:');
    years.forEach(y => {
      console.log(`  - ${y.academic_year}: ${y.count} records`);
    });

    // Get unique class/subject combinations
    console.log('\n' + '='.repeat(60));
    console.log('\n📚 STEP 3: Checking class/subject combinations...\n');

    const combinations = await sql`
      SELECT
        st.class_name,
        m.subject,
        m.term,
        m.academic_year,
        COUNT(*) as student_count
      FROM marks m
      JOIN students st ON m.student_id = st.id
      GROUP BY st.class_name, m.subject, m.term, m.academic_year
      ORDER BY st.class_name, m.subject, m.term
    `;

    console.log(`Found ${combinations.length} class/subject/term combinations:`);
    console.log('');
    combinations.forEach((combo, index) => {
      console.log(`${index + 1}. ${combo.class_name} - ${combo.subject}`);
      console.log(`   Term: ${combo.term}, Year: ${combo.academic_year}`);
      console.log(`   Students: ${combo.student_count}`);
      console.log('');
    });

    // Check system config for current term
    console.log('='.repeat(60));
    console.log('\n⚙️  STEP 4: Checking system configuration...\n');

    const config = await sql`
      SELECT config_key, config_value
      FROM system_config
      WHERE config_key IN ('current_term', 'current_academic_year')
    `;

    console.log('Current system settings:');
    config.forEach(c => {
      console.log(`  - ${c.config_key}: ${c.config_value}`);
    });

    // Check for mismatches
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 STEP 5: Identifying potential issues...\n');

    const currentTerm = config.find(c => c.config_key === 'current_term')?.config_value;
    const currentYear = config.find(c => c.config_key === 'current_academic_year')?.config_value;

    const marksInCurrentTerm = await sql`
      SELECT COUNT(*) as count
      FROM marks
      WHERE term = ${currentTerm}
        AND academic_year = ${currentYear}
    `;

    console.log(`System is configured for: ${currentTerm} ${currentYear}`);
    console.log(`Marks in current term/year: ${marksInCurrentTerm[0].count}`);

    if (marksInCurrentTerm[0].count === 0) {
      console.log('\n❌ ISSUE FOUND: No marks in current term/year!');
      console.log('');
      console.log('This is why loading returns "No saved marks found"');
      console.log('');
      console.log('Possible solutions:');
      console.log('1. Save some marks for the current term/year');
      console.log('2. Change system config to match existing marks:');
      terms.forEach(t => {
        console.log(`   - UPDATE system_config SET config_value = '${t.term}' WHERE config_key = 'current_term'`);
      });
    } else {
      console.log('\n✅ Marks exist for current term/year');
    }

    // Sample some actual marks
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 STEP 6: Sample marks data...\n');

    const sampleMarks = await sql`
      SELECT
        m.*,
        st.first_name,
        st.last_name,
        st.class_name,
        st.id_number
      FROM marks m
      JOIN students st ON m.student_id = st.id
      LIMIT 5
    `;

    console.log('Sample marks (first 5 records):');
    console.log('');
    sampleMarks.forEach((mark, index) => {
      console.log(`${index + 1}. ${mark.first_name} ${mark.last_name} (${mark.id_number})`);
      console.log(`   Class: ${mark.class_name}`);
      console.log(`   Subject: ${mark.subject}`);
      console.log(`   Term: ${mark.term}, Year: ${mark.academic_year}`);
      console.log(`   Scores: Test1=${mark.test1}, Test2=${mark.test2}, Test3=${mark.test3}, Test4=${mark.test4}, Exam=${mark.exam}`);
      console.log(`   Total: ${mark.total}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

diagnoseMarks();

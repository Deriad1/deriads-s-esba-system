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

async function fixTermMismatch() {
  console.log('\n🔧 FIXING TERM/YEAR MISMATCH\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Standardize term names in marks table
    console.log('\n📝 STEP 1: Standardizing term names in marks...\n');

    // Update "Term 1" → "First Term"
    const term1Fix = await sql`
      UPDATE marks
      SET term = 'First Term',
          updated_at = NOW()
      WHERE term = 'Term 1'
      RETURNING id
    `;
    console.log(`✓ Updated ${term1Fix.length} records from "Term 1" → "First Term"`);

    // Update "Term 3" → "Third Term"
    const term3Fix = await sql`
      UPDATE marks
      SET term = 'Third Term',
          updated_at = NOW()
      WHERE term = 'Term 3'
      RETURNING id
    `;
    console.log(`✓ Updated ${term3Fix.length} records from "Term 3" → "Third Term"`);

    // Step 2: Update system config to match marks
    console.log('\n📝 STEP 2: Updating system configuration...\n');

    // Update academic year to 2025/2026
    const yearUpdate = await sql`
      UPDATE system_config
      SET config_value = '2025/2026',
          updated_at = NOW()
      WHERE config_key = 'current_academic_year'
      RETURNING config_value
    `;
    console.log(`✓ Updated academic year: ${yearUpdate[0].config_value}`);

    // Update current term (keeping "First Term" for now)
    const termUpdate = await sql`
      UPDATE system_config
      SET config_value = 'First Term',
          updated_at = NOW()
      WHERE config_key = 'current_term'
      RETURNING config_value
    `;
    console.log(`✓ Current term: ${termUpdate[0].config_value}`);

    // Step 3: Verify the fix
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 STEP 3: Verifying the fix...\n');

    const config = await sql`
      SELECT config_key, config_value
      FROM system_config
      WHERE config_key IN ('current_term', 'current_academic_year')
    `;

    console.log('System configuration:');
    config.forEach(c => {
      console.log(`  ${c.config_key}: ${c.config_value}`);
    });

    const currentTerm = config.find(c => c.config_key === 'current_term')?.config_value;
    const currentYear = config.find(c => c.config_key === 'current_academic_year')?.config_value;

    const marksCount = await sql`
      SELECT COUNT(*) as count
      FROM marks
      WHERE term = ${currentTerm}
        AND academic_year = ${currentYear}
    `;

    console.log(`\nMarks in current term/year: ${marksCount[0].count}`);

    if (marksCount[0].count > 0) {
      console.log('✅ SUCCESS! Marks can now be loaded for current term/year\n');
    } else {
      console.log('⚠️  No marks found for current term/year');
      console.log('You may need to:');
      console.log('1. Change current_term to match available marks');
      console.log('2. Or save new marks for the current term\n');
    }

    // Show term distribution
    const termDist = await sql`
      SELECT term, academic_year, COUNT(*) as count
      FROM marks
      GROUP BY term, academic_year
      ORDER BY academic_year, term
    `;

    console.log('Term distribution in database:');
    termDist.forEach(t => {
      const isCurrent = t.term === currentTerm && t.academic_year === currentYear;
      const marker = isCurrent ? '← CURRENT' : '';
      console.log(`  ${t.term} ${t.academic_year}: ${t.count} records ${marker}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Fix complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

fixTermMismatch();

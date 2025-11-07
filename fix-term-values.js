import 'dotenv/config';
import { sql } from './api/lib/db.js';

/**
 * Fix inconsistent term values in the database
 * Standardizes to "First Term", "Second Term", "Third Term" format
 */
async function fixTermValues() {
  console.log('Starting term value standardization...\n');

  try {
    // Fix marks table
    console.log('Updating marks table...');
    const marksResult = await sql`
      UPDATE marks
      SET term = CASE
        WHEN term = 'Term 1' THEN 'First Term'
        WHEN term = 'Term 2' THEN 'Second Term'
        WHEN term = 'Term 3' THEN 'Third Term'
        ELSE term
      END
      WHERE term IN ('Term 1', 'Term 2', 'Term 3')
    `;
    console.log(`✓ Updated ${marksResult.count || 0} records in marks table`);

    // Fix students table
    console.log('Updating students table...');
    const studentsResult = await sql`
      UPDATE students
      SET term = CASE
        WHEN term = 'Term 1' THEN 'First Term'
        WHEN term = 'Term 2' THEN 'Second Term'
        WHEN term = 'Term 3' THEN 'Third Term'
        ELSE term
      END
      WHERE term IN ('Term 1', 'Term 2', 'Term 3')
    `;
    console.log(`✓ Updated ${studentsResult.count || 0} records in students table`);

    // Verify changes
    console.log('\nVerifying changes...');
    const marksCheck = await sql`
      SELECT DISTINCT term FROM marks ORDER BY term
    `;
    console.log('Distinct term values in marks:', marksCheck.map(r => r.term));

    const studentsCheck = await sql`
      SELECT DISTINCT term FROM students ORDER BY term
    `;
    console.log('Distinct term values in students:', studentsCheck.map(r => r.term));

    console.log('\n✓ Term standardization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing term values:', error);
    process.exit(1);
  }
}

fixTermValues();

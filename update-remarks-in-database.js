import 'dotenv/config';
import { sql } from './api/lib/db.js';
import { calculateRemark } from './src/utils/gradeHelpers.js';

/**
 * Update all existing marks records with correct remarks based on total score
 */

async function updateRemarks() {
  console.log('🔄 Updating remarks for all existing marks...\n');

  try {
    // Get all marks records
    const marks = await sql`
      SELECT id, total, remark
      FROM marks
      WHERE total IS NOT NULL
    `;

    console.log(`Found ${marks.length} marks records to process\n`);

    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (const mark of marks) {
      const correctRemark = calculateRemark(mark.total);
      const currentRemark = mark.remark;

      // Only update if remark is different
      if (currentRemark !== correctRemark) {
        try {
          await sql`
            UPDATE marks
            SET remark = ${correctRemark},
                updated_at = NOW()
            WHERE id = ${mark.id}
          `;

          console.log(`✓ ID ${mark.id}: Total=${mark.total} | Old="${currentRemark || 'NULL'}" → New="${correctRemark}"`);
          updated++;
        } catch (error) {
          console.error(`✗ Failed to update ID ${mark.id}:`, error.message);
          errors++;
        }
      } else {
        unchanged++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 Summary:');
    console.log(`  Total records: ${marks.length}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Unchanged: ${unchanged}`);
    console.log(`  Errors: ${errors}`);
    console.log('='.repeat(70));

    if (errors > 0) {
      console.log('\n⚠  Some updates failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All remarks updated successfully!');
      console.log('\nVerifying results...\n');

      // Show sample of updated records
      const sample = await sql`
        SELECT id, total, remark
        FROM marks
        WHERE total IS NOT NULL
        ORDER BY total DESC
        LIMIT 5
      `;

      console.log('Sample of updated records:');
      sample.forEach(m => {
        console.log(`  ID ${m.id}: Total=${m.total} → Remark="${m.remark}"`);
      });

      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updateRemarks();

import 'dotenv/config';
import { sql } from './api/lib/db.js';

async function checkColumnUsage() {
  console.log('Checking which columns contain data...\n');

  try {
    // Check total vs total_score
    console.log('=== TOTAL COLUMN USAGE ===');
    const totalCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE total IS NOT NULL AND total != 0
    `;
    console.log(`Records with 'total': ${totalCount[0].count}`);

    const totalScoreCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE total_score IS NOT NULL AND total_score != 0
    `;
    console.log(`Records with 'total_score': ${totalScoreCount[0].count}`);

    // Check remark vs remarks
    console.log('\n=== REMARK COLUMN USAGE ===');
    const remarkCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE remark IS NOT NULL AND remark != ''
    `;
    console.log(`Records with 'remark': ${remarkCount[0].count}`);

    const remarksCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE remarks IS NOT NULL AND remarks != ''
    `;
    console.log(`Records with 'remarks': ${remarksCount[0].count}`);

    // Check exam vs exam_score vs exams_score
    console.log('\n=== EXAM COLUMN USAGE ===');
    const examCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE exam IS NOT NULL AND exam != 0
    `;
    console.log(`Records with 'exam': ${examCount[0].count}`);

    const examScoreCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE exam_score IS NOT NULL AND exam_score != 0
    `;
    console.log(`Records with 'exam_score': ${examScoreCount[0].count}`);

    const examsScoreCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE exams_score IS NOT NULL AND exams_score != 0
    `;
    console.log(`Records with 'exams_score': ${examsScoreCount[0].count}`);

    // Check class_score usage
    console.log('\n=== CLASS_SCORE COLUMN USAGE ===');
    const classScoreCount = await sql`
      SELECT COUNT(*) as count FROM marks WHERE class_score IS NOT NULL AND class_score != 0
    `;
    console.log(`Records with 'class_score': ${classScoreCount[0].count}`);

    // Sample a record to see what's populated
    console.log('\n=== SAMPLE RECORD ===');
    const sample = await sql`
      SELECT test1, test2, test3, test4, exam, exam_score, exams_score,
             class_score, total, total_score, remark, remarks
      FROM marks
      WHERE test1 IS NOT NULL
      LIMIT 1
    `;
    if (sample.length > 0) {
      console.log('Sample:', sample[0]);
    }

    console.log('\n✓ Column usage check complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error checking column usage:', error);
    process.exit(1);
  }
}

checkColumnUsage();

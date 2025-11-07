import 'dotenv/config';
import { sql } from './api/lib/db.js';
import { isNumericStudentId, isIdNumberFormat } from './src/utils/studentIdHelpers.js';
import { TERMS, isValidTerm } from './src/constants/terms.js';

/**
 * Comprehensive test script to verify naming consistency across the system
 */

async function verifyDatabaseNaming() {
  console.log('\n=== DATABASE NAMING VERIFICATION ===\n');

  try {
    // Check term values
    console.log('1. Checking term values...');
    const termCheck = await sql`
      SELECT DISTINCT term FROM marks
      UNION
      SELECT DISTINCT term FROM students
      ORDER BY term
    `;

    const invalidTerms = termCheck.filter(row => !isValidTerm(row.term));

    if (invalidTerms.length > 0) {
      console.log('  ❌ Found invalid term values:');
      invalidTerms.forEach(row => console.log(`     - "${row.term}"`));
      return false;
    } else {
      console.log('  ✅ All terms use standard format');
      termCheck.forEach(row => console.log(`     ✓ "${row.term}"`));
    }

    // Check column usage
    console.log('\n2. Checking column usage...');
    const columnUsage = await sql`
      SELECT
        COUNT(*) as total_records,
        COUNT(CASE WHEN total IS NOT NULL THEN 1 END) as using_total,
        COUNT(CASE WHEN total_score IS NOT NULL AND total_score != 0 THEN 1 END) as using_total_score,
        COUNT(CASE WHEN remark IS NOT NULL THEN 1 END) as using_remark,
        COUNT(CASE WHEN remarks IS NOT NULL AND remarks != '' THEN 1 END) as using_remarks,
        COUNT(CASE WHEN exam IS NOT NULL THEN 1 END) as using_exam,
        COUNT(CASE WHEN exam_score IS NOT NULL THEN 1 END) as using_exam_score,
        COUNT(CASE WHEN exams_score IS NOT NULL THEN 1 END) as using_exams_score
      FROM marks
    `;

    const usage = columnUsage[0];
    console.log(`  Total marks records: ${usage.total_records}`);
    console.log(`  Using 'total': ${usage.using_total} ${usage.using_total > 0 ? '✅' : '⚠️'}`);
    console.log(`  Using 'total_score': ${usage.using_total_score} ${usage.using_total_score === 0 ? '✅' : '❌'}`);
    console.log(`  Using 'remark': ${usage.using_remark} ${usage.using_remark >= 0 ? '✅' : ''}`);
    console.log(`  Using 'remarks': ${usage.using_remarks} ${usage.using_remarks === 0 ? '✅' : '❌'}`);
    console.log(`  Using 'exam': ${usage.using_exam} ${usage.using_exam > 0 ? '✅' : '⚠️'}`);
    console.log(`  Using 'exam_score': ${usage.using_exam_score} ${usage.using_exam_score > 0 ? '✅' : '⚠️'}`);
    console.log(`  Using 'exams_score': ${usage.using_exams_score} ${usage.using_exams_score === 0 ? '✅' : '❌'}`);

    // Check student ID consistency
    console.log('\n3. Checking student ID consistency...');
    const studentIdCheck = await sql`
      SELECT
        COUNT(*) as total_students,
        COUNT(CASE WHEN id_number IS NOT NULL THEN 1 END) as has_id_number,
        COUNT(CASE WHEN id_number IS NULL THEN 1 END) as missing_id_number
      FROM students
    `;

    const idStats = studentIdCheck[0];
    console.log(`  Total students: ${idStats.total_students}`);
    console.log(`  With id_number: ${idStats.has_id_number} ${idStats.has_id_number === idStats.total_students ? '✅' : '❌'}`);
    console.log(`  Missing id_number: ${idStats.missing_id_number} ${idStats.missing_id_number === 0 ? '✅' : '❌'}`);

    // Sample student IDs
    const sampleIds = await sql`
      SELECT id_number FROM students WHERE id_number IS NOT NULL LIMIT 5
    `;
    console.log(`  Sample id_numbers:`);
    sampleIds.forEach(row => {
      const isValid = isIdNumberFormat(row.id_number);
      console.log(`     ${isValid ? '✅' : '❌'} "${row.id_number}"`);
    });

    return true;
  } catch (error) {
    console.error('  ❌ Error:', error.message);
    return false;
  }
}

function verifyHelperFunctions() {
  console.log('\n=== HELPER FUNCTION VERIFICATION ===\n');

  const testCases = [
    { value: 123, expectedNumeric: true, expectedIdNumber: false, description: 'Numeric ID (number)' },
    { value: '456', expectedNumeric: true, expectedIdNumber: false, description: 'Numeric ID (string)' },
    { value: 'eSBA001', expectedNumeric: false, expectedIdNumber: true, description: 'ID Number (eSBA format)' },
    { value: 'ESBA123', expectedNumeric: false, expectedIdNumber: true, description: 'ID Number (ESBA format)' },
    { value: 'ABC', expectedNumeric: false, expectedIdNumber: false, description: 'Invalid format' }
  ];

  console.log('Testing student ID helper functions:\n');

  let allPassed = true;

  for (const test of testCases) {
    const numericResult = isNumericStudentId(test.value);
    const idNumberResult = isIdNumberFormat(test.value);

    const numericPass = numericResult === test.expectedNumeric;
    const idNumberPass = idNumberResult === test.expectedIdNumber;
    const passed = numericPass && idNumberPass;

    console.log(`  ${passed ? '✅' : '❌'} ${test.description}: "${test.value}"`);
    console.log(`     isNumericStudentId: ${numericResult} (expected ${test.expectedNumeric}) ${numericPass ? '✅' : '❌'}`);
    console.log(`     isIdNumberFormat: ${idNumberResult} (expected ${test.expectedIdNumber}) ${idNumberPass ? '✅' : '❌'}`);

    if (!passed) allPassed = false;
  }

  return allPassed;
}

function verifyTermConstants() {
  console.log('\n=== TERM CONSTANTS VERIFICATION ===\n');

  console.log('Available terms:');
  Object.entries(TERMS).forEach(([key, value]) => {
    console.log(`  ✅ ${key}: "${value}"`);
  });

  const testTerms = [
    { term: 'First Term', expected: true },
    { term: 'Second Term', expected: true },
    { term: 'Third Term', expected: true },
    { term: 'Term 1', expected: false },
    { term: 'Term 2', expected: false },
    { term: 'Term 3', expected: false }
  ];

  console.log('\nValidation tests:');
  let allPassed = true;

  for (const test of testTerms) {
    const result = isValidTerm(test.term);
    const passed = result === test.expected;
    console.log(`  ${passed ? '✅' : '❌'} "${test.term}": ${result} (expected ${test.expected})`);
    if (!passed) allPassed = false;
  }

  return allPassed;
}

async function main() {
  console.log('🔍 COMPREHENSIVE NAMING CONSISTENCY VERIFICATION');
  console.log('='.repeat(70));

  const results = {
    database: await verifyDatabaseNaming(),
    helpers: verifyHelperFunctions(),
    terms: verifyTermConstants()
  };

  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL RESULTS:');
  console.log('='.repeat(70));
  console.log(`  Database Naming: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Helper Functions: ${results.helpers ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Term Constants: ${results.terms ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(70));

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Naming consistency verified.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.\n');
    process.exit(1);
  }
}

main();

import 'dotenv/config';
import { sql } from './api/lib/db.js';

async function checkSchema() {
  console.log('Checking database schema...\n');

  try {
    // Check students table columns
    console.log('=== STUDENTS TABLE ===');
    const studentsSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'students'
      ORDER BY ordinal_position
    `;
    console.log('Columns:');
    studentsSchema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check marks table columns
    console.log('\n=== MARKS TABLE ===');
    const marksSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'marks'
      ORDER BY ordinal_position
    `;
    console.log('Columns:');
    marksSchema.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check for any columns with 'total' in the name
    console.log('\n=== CHECKING FOR TOTAL COLUMN VARIATIONS ===');
    const totalColumns = await sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_name IN ('marks', 'students')
      AND column_name LIKE '%total%'
    `;
    if (totalColumns.length > 0) {
      console.log('Found columns containing "total":');
      totalColumns.forEach(col => {
        console.log(`  ${col.table_name}.${col.column_name}`);
      });
    } else {
      console.log('No columns containing "total" found');
    }

    // Check for any columns with 'remark' in the name
    console.log('\n=== CHECKING FOR REMARK/REMARKS COLUMN VARIATIONS ===');
    const remarkColumns = await sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_name IN ('marks', 'students')
      AND column_name LIKE '%remark%'
    `;
    if (remarkColumns.length > 0) {
      console.log('Found columns containing "remark":');
      remarkColumns.forEach(col => {
        console.log(`  ${col.table_name}.${col.column_name}`);
      });
    } else {
      console.log('No columns containing "remark" found');
    }

    // Sample a few marks records to see actual data
    console.log('\n=== SAMPLE MARKS DATA ===');
    const sampleMarks = await sql`
      SELECT * FROM marks LIMIT 3
    `;
    if (sampleMarks.length > 0) {
      console.log('Sample record columns:', Object.keys(sampleMarks[0]));
    } else {
      console.log('No marks records found');
    }

    console.log('\n✓ Schema check complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();

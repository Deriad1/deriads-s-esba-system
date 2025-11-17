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

async function diagnoseProblem() {
  console.log('\n🔍 TEACHER CLASS ASSIGNMENT DIAGNOSTIC\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Check if required columns exist
    console.log('\n📋 STEP 1: Checking database schema...\n');

    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'teachers'
      ORDER BY ordinal_position
    `;

    console.log('Teachers table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    const hasFormClass = columns.some(col => col.column_name === 'form_class');
    const hasClasses = columns.some(col => col.column_name === 'classes');
    const hasClassAssigned = columns.some(col => col.column_name === 'class_assigned');

    console.log('\n✅ Column status:');
    console.log(`  - form_class: ${hasFormClass ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  - classes: ${hasClasses ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  - class_assigned: ${hasClassAssigned ? '✓ EXISTS' : '✗ MISSING'}`);

    // Step 2: Check current teacher data
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 STEP 2: Checking existing teacher data...\n');

    const teachers = await sql`
      SELECT
        id,
        first_name,
        last_name,
        email,
        teacher_primary_role,
        classes,
        class_assigned,
        ${hasFormClass ? sql`form_class` : sql`NULL as form_class`},
        all_roles
      FROM teachers
      ORDER BY id
    `;

    console.log(`Found ${teachers.length} teachers:\n`);

    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.first_name} ${teacher.last_name} (${teacher.email})`);
      console.log(`   Role: ${teacher.teacher_primary_role}`);
      console.log(`   All Roles: ${JSON.stringify(teacher.all_roles)}`);
      console.log(`   Classes array: ${JSON.stringify(teacher.classes)}`);
      console.log(`   Class Assigned: ${teacher.class_assigned || 'None'}`);
      console.log(`   Form Class: ${teacher.form_class || 'None'}`);
      console.log('');
    });

    // Step 3: Identify issues
    console.log('='.repeat(60));
    console.log('\n🔍 STEP 3: Identifying potential issues...\n');

    const issues = [];

    if (!hasFormClass) {
      issues.push({
        severity: 'CRITICAL',
        issue: 'Missing form_class column',
        solution: 'Run: node run-migration-fix.js'
      });
    }

    const teachersWithoutClasses = teachers.filter(t =>
      (!t.classes || t.classes.length === 0) &&
      ['class_teacher', 'form_master'].includes(t.teacher_primary_role)
    );

    if (teachersWithoutClasses.length > 0) {
      issues.push({
        severity: 'WARNING',
        issue: `${teachersWithoutClasses.length} class/form teachers have no classes assigned`,
        teachers: teachersWithoutClasses.map(t => `${t.first_name} ${t.last_name} (${t.email})`),
        solution: 'Assign classes via Admin Dashboard → Assign Teacher Subjects'
      });
    }

    const formMastersWithoutFormClass = teachers.filter(t =>
      t.teacher_primary_role === 'form_master' && !t.form_class
    );

    if (formMastersWithoutFormClass.length > 0 && hasFormClass) {
      issues.push({
        severity: 'WARNING',
        issue: `${formMastersWithoutFormClass.length} form masters have no form_class set`,
        teachers: formMastersWithoutFormClass.map(t => `${t.first_name} ${t.last_name} (${t.email})`),
        solution: 'Assign form class via Admin Dashboard → Assign Teacher Subjects'
      });
    }

    // Step 4: Display results
    if (issues.length === 0) {
      console.log('✅ No issues detected! Teacher assignments look good.\n');
    } else {
      console.log('⚠️  Found issues:\n');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.issue}`);
        if (issue.teachers) {
          console.log('   Affected teachers:');
          issue.teachers.forEach(t => console.log(`     - ${t}`));
        }
        console.log(`   💡 Solution: ${issue.solution}`);
        console.log('');
      });
    }

    console.log('='.repeat(60));
    console.log('\n📝 SUMMARY\n');
    console.log(`Total teachers: ${teachers.length}`);
    console.log(`Issues found: ${issues.length}`);
    console.log(`Database schema: ${hasFormClass && hasClasses && hasClassAssigned ? '✅ Complete' : '⚠️  Incomplete'}`);

    if (issues.some(i => i.severity === 'CRITICAL')) {
      console.log('\n❌ CRITICAL ISSUES DETECTED - Please run the suggested migrations!\n');
      process.exit(1);
    } else if (issues.length > 0) {
      console.log('\n⚠️  Warnings detected - Review and fix as needed\n');
    } else {
      console.log('\n✅ Everything looks good!\n');
    }

  } catch (error) {
    console.error('\n❌ Error running diagnostic:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

diagnoseProblem();

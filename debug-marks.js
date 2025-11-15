// Debug script to check marks data
// Run with: node debug-marks.js

import { sql } from './api/lib/db.js';

async function debugMarks() {
  try {
    console.log('\n=== Checking Mathematics Marks ===\n');

    // Get all marks for Mathematics
    const mathMarks = await sql`
      SELECT
        m.id,
        m.student_id,
        m.subject,
        m.test1, m.test2, m.test3, m.test4,
        m.ca1, m.ca2, m.exam, m.total,
        m.term, m.academic_year,
        s.id_number, s.first_name, s.last_name, s.class_name
      FROM marks m
      LEFT JOIN students s ON m.student_id = s.id
      WHERE LOWER(m.subject) LIKE '%math%'
      ORDER BY s.class_name, s.last_name
      LIMIT 20
    `;

    console.log(`Found ${mathMarks.length} Mathematics marks entries:\n`);
    mathMarks.forEach(mark => {
      console.log(`Student: ${mark.first_name} ${mark.last_name} (${mark.id_number})`);
      console.log(`  Class: ${mark.class_name}`);
      console.log(`  Subject: "${mark.subject}"`);
      console.log(`  Term: ${mark.term}, Year: ${mark.academic_year}`);
      console.log(`  Tests: ${mark.test1}, ${mark.test2}, ${mark.test3}, ${mark.test4}`);
      console.log(`  CA: ${mark.ca1}, ${mark.ca2}, Exam: ${mark.exam}, Total: ${mark.total}`);
      console.log('---');
    });

    console.log('\n=== Checking Teacher Assignments for Mathematics ===\n');

    // Get teacher assignments
    const teachers = await sql`
      SELECT
        first_name, last_name,
        subjects,
        classes,
        class_assigned,
        form_class
      FROM teachers
      WHERE 'Mathematics' = ANY(subjects)
         OR 'Maths' = ANY(subjects)
         OR 'Math' = ANY(subjects)
    `;

    console.log(`Found ${teachers.length} teachers assigned to teach Mathematics:\n`);
    teachers.forEach(teacher => {
      console.log(`Teacher: ${teacher.first_name} ${teacher.last_name}`);
      console.log(`  Subjects: ${JSON.stringify(teacher.subjects)}`);
      console.log(`  Classes: ${JSON.stringify(teacher.classes)}`);
      console.log(`  Class Assigned: ${teacher.class_assigned}`);
      console.log(`  Form Class: ${teacher.form_class}`);
      console.log('---');
    });

    console.log('\n=== Checking All Unique Subject Names ===\n');

    const uniqueSubjects = await sql`
      SELECT DISTINCT subject
      FROM marks
      ORDER BY subject
    `;

    console.log('All subjects in marks table:');
    uniqueSubjects.forEach(s => console.log(`  - "${s.subject}"`));

    const teacherSubjects = await sql`
      SELECT DISTINCT unnest(subjects) as subject
      FROM teachers
      ORDER BY subject
    `;

    console.log('\nAll subjects in teacher assignments:');
    teacherSubjects.forEach(s => console.log(`  - "${s.subject}"`));

  } catch (error) {
    console.error('Error:', error);
  }
}

debugMarks();

/**
 * Simplified script to add performance indexes
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function createIndexes() {
  console.log('🚀 Creating performance indexes...\n');

  const indexes = [
    // Students indexes
    { name: 'idx_students_class_name', sql: 'CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name)' },
    { name: 'idx_students_name', sql: 'CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name)' },
    { name: 'idx_students_id_number', sql: 'CREATE INDEX IF NOT EXISTS idx_students_id_number ON students(id_number)' },

    // Scores indexes (check if table is named 'scores' or 'marks')
    { name: 'idx_scores_student_id', sql: 'CREATE INDEX IF NOT EXISTS idx_scores_student_id ON scores(student_id)' },
    { name: 'idx_scores_subject_term', sql: 'CREATE INDEX IF NOT EXISTS idx_scores_subject_term ON scores(subject, term)' },
    { name: 'idx_scores_class_name', sql: 'CREATE INDEX IF NOT EXISTS idx_scores_class_name ON scores(class_name)' },

    // Teachers indexes
    { name: 'idx_teachers_email', sql: 'CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email)' },
    { name: 'idx_teachers_primary_role', sql: 'CREATE INDEX IF NOT EXISTS idx_teachers_primary_role ON teachers(teacher_primary_role)' },
    { name: 'idx_teachers_form_class', sql: 'CREATE INDEX IF NOT EXISTS idx_teachers_form_class ON teachers(form_class)' },
  ];

  for (const index of indexes) {
    try {
      await sql`${sql.unsafe(index.sql)}`;
      console.log(`✅ ${index.name}`);
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log(`⏭️  ${index.name} (table not found)`);
      } else if (error.message.includes('already exists')) {
        console.log(`⏭️  ${index.name} (already exists)`);
      } else {
        console.log(`❌ ${index.name}: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Done!');
}

createIndexes();

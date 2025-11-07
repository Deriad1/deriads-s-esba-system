import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function applyMarksIndexes() {
  console.log('🚀 Adding indexes for marks and student_scores tables...\n');

  const queries = [
    // Marks table indexes
    'CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_marks_subject_term ON marks(subject, term)',
    'CREATE INDEX IF NOT EXISTS idx_marks_class_name ON marks(class_name)',

    // Student_scores table indexes
    'CREATE INDEX IF NOT EXISTS idx_student_scores_student_id ON student_scores(student_id)',
    'CREATE INDEX IF NOT EXISTS idx_student_scores_subject ON student_scores(subject)',

    // Classes table indexes
    'CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name)',

    // Analyze
    'ANALYZE marks',
    'ANALYZE student_scores',
    'ANALYZE classes'
  ];

  let successCount = 0;

  for (const query of queries) {
    try {
      await sql([query]);

      if (query.startsWith('CREATE INDEX')) {
        const indexName = query.match(/idx_\w+/)?.[0] || 'unknown';
        console.log(`✅ Created: ${indexName}`);
        successCount++;
      } else if (query.startsWith('ANALYZE')) {
        const tableName = query.split(' ')[1];
        console.log(`📊 Analyzed: ${tableName}`);
      }
    } catch (error) {
      if (error.message.includes('already exists')) {
        const indexName = query.match(/idx_\w+/)?.[0] || 'unknown';
        console.log(`⏭️  Exists: ${indexName}`);
      } else {
        console.error(`❌ Error: ${error.message.substring(0, 100)}`);
      }
    }
  }

  console.log(`\n✅ Successfully created ${successCount} additional indexes!`);
}

applyMarksIndexes().catch(console.error);

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function fixTermFormat() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Starting term format migration...');

  // Update marks table
  const marksResult = await sql`
    UPDATE marks
    SET term = CASE
      WHEN term = 'Term 1' THEN 'First Term'
      WHEN term = 'Term 2' THEN 'Second Term'
      WHEN term = 'Term 3' THEN 'Third Term'
      ELSE term
    END
    WHERE term IN ('Term 1', 'Term 2', 'Term 3')
    RETURNING *
  `;
  console.log(`✅ Updated ${marksResult.length} marks records`);

  // Update remarks table
  try {
    const remarksResult = await sql`
      UPDATE remarks
      SET term = CASE
        WHEN term = 'Term 1' THEN 'First Term'
        WHEN term = 'Term 2' THEN 'Second Term'
        WHEN term = 'Term 3' THEN 'Third Term'
        ELSE term
      END
      WHERE term IN ('Term 1', 'Term 2', 'Term 3')
      RETURNING *
    `;
    console.log(`✅ Updated ${remarksResult.length} remarks records`);
  } catch (err) {
    console.log('ℹ️  No remarks table or already updated');
  }

  // Check results
  const check = await sql`
    SELECT DISTINCT term, COUNT(*) as count
    FROM marks
    GROUP BY term
    ORDER BY term
  `;

  console.log('\n📊 Current term distribution in database:');
  console.log(check);
  console.log('\n✅ Migration complete!');
}

fixTermFormat().catch(console.error);

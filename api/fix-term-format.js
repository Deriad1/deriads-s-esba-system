import { sql } from './lib/db.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Fix term naming format in database
 * Convert: "Term 1" → "First Term", "Term 2" → "Second Term", "Term 3" → "Third Term"
 */

async function fixTermFormat() {
    console.log('Starting term format migration...');

    try {
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
    `;
        console.log(`✅ Updated ${marksResult.count} marks records`);

        // Update any other tables that might have term column
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
      `;
            console.log(`✅ Updated ${remarksResult.count} remarks records`);
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

        console.log('📊 Current term distribution in database:');
        console.table(check);

        console.log('✅ Migration complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

fixTermFormat();

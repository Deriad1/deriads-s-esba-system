// Migration to fix term naming inconsistency
// Change from "First Term", "Second Term", "Third Term"
// to "Term 1", "Term 2", "Term 3"
import { sql } from './lib/db.js';

export default async function handler(req, res) {
  try {
    console.log('[Fix Term Naming] Starting migration...');

    // Update remarks table
    console.log('[Fix Term Naming] Updating remarks table...');
    const remarksResult = await sql`
      UPDATE remarks
      SET term = CASE
        WHEN term = 'First Term' THEN 'Term 1'
        WHEN term = 'Second Term' THEN 'Term 2'
        WHEN term = 'Third Term' THEN 'Term 3'
        ELSE term
      END
      WHERE term IN ('First Term', 'Second Term', 'Third Term')
      RETURNING *
    `;
    console.log('[Fix Term Naming] Updated', remarksResult.length, 'remarks records');

    // Update marks table
    console.log('[Fix Term Naming] Updating marks table...');
    const marksResult = await sql`
      UPDATE marks
      SET term = CASE
        WHEN term = 'First Term' THEN 'Term 1'
        WHEN term = 'Second Term' THEN 'Term 2'
        WHEN term = 'Third Term' THEN 'Term 3'
        ELSE term
      END
      WHERE term IN ('First Term', 'Second Term', 'Third Term')
      RETURNING *
    `;
    console.log('[Fix Term Naming] Updated', marksResult.length, 'marks records');

    // Update assessments table
    console.log('[Fix Term Naming] Updating assessments table...');
    const assessmentsResult = await sql`
      UPDATE assessments
      SET term = CASE
        WHEN term = 'First Term' THEN 'Term 1'
        WHEN term = 'Second Term' THEN 'Term 2'
        WHEN term = 'Third Term' THEN 'Term 3'
        ELSE term
      END
      WHERE term IN ('First Term', 'Second Term', 'Third Term')
      RETURNING *
    `;
    console.log('[Fix Term Naming] Updated', assessmentsResult.length, 'assessments records');

    // Verify the changes
    console.log('[Fix Term Naming] Verifying changes...');
    const remarksTerms = await sql`
      SELECT term, COUNT(*) as count
      FROM remarks
      GROUP BY term
      ORDER BY term
    `;

    const marksTerms = await sql`
      SELECT term, COUNT(*) as count
      FROM marks
      GROUP BY term
      ORDER BY term
    `;

    return res.json({
      status: 'success',
      message: 'Term naming migration completed successfully',
      updated: {
        remarks: remarksResult.length,
        marks: marksResult.length,
        assessments: assessmentsResult.length
      },
      verification: {
        remarksTerms,
        marksTerms
      }
    });
  } catch (error) {
    console.error('[Fix Term Naming] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
}
